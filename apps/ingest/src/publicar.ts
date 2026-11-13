// Publicação: gera o snapshot JSON que o site lê (contrato em @portal/metrics/publicacao).
// O site público não acessa o banco (DEC-12, SEG-01). Cada número sai com a proveniência do
// cálculo, e o dado bruto que o sustenta vai junto (DEC-07): a etapa confere que a soma do
// bruto publicado bate com o número calculado e falha se não bater.
//
// Escrita atômica: monta tudo num diretório temporário e troca de uma vez.

import { createHash } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Sql } from '@portal/db';
import { ESTAGIOS_FUNIL, type EstagioFunil, type FrequenciaDia } from '@portal/metrics';
import {
  VERSAO_PUBLICACAO,
  posicaoRelativa,
  type CotaPublicada,
  type DeputadoPublicado,
  type DistribuicaoPublicada,
  type FontePublicada,
  type IndicePublicado,
  type PresencaPublicada,
  type ProjetosPublicados,
  type ProvenienciaPublicada,
  type ResumoDeputado,
} from '@portal/metrics/publicacao';
import { FONTES, LEGISLATURA_ATUAL, urlPresencasDia, urlPublicaDeputado } from '@portal/sources';

export function raizPublicacaoPadrao(): string {
  return process.env['PUBLICADO_DIR'] ?? join(import.meta.dirname, '..', '..', '..', 'data', 'publicado');
}

type Metrica = ProvenienciaPublicada['metrica'];

/** Onde o cidadão confere cada fonte (página oficial, não o endpoint técnico quando houver). */
const FONTE_PUBLICA: Record<string, string> = {
  'SRC-01': 'https://dadosabertos.camara.leg.br/swagger/api.html',
  'SRC-01b': 'https://dadosabertos.camara.leg.br/arquivos',
  'SRC-01c': 'https://www.camara.leg.br/transparencia/gastos-parlamentares',
  'SRC-01d': 'https://www.camara.leg.br/SitCamaraWS/sessoesreunioes.asmx',
};

function fontes(ids: readonly string[]): FontePublicada[] {
  return [...new Set(ids)].sort().map((id) => {
    const f = FONTES.find((x) => x.id === id);
    return { id, nome: f?.nome ?? id, url: FONTE_PUBLICA[id] ?? f?.urlBase ?? '' };
  });
}

const dist = (l: { n: number; media?: number | null; mediana: number; p25: number; p75: number; minimo: number; maximo: number } | undefined): DistribuicaoPublicada | null =>
  l ? { n: l.n, media: l.media ?? null, mediana: l.mediana, p25: l.p25, p75: l.p75, minimo: l.minimo, maximo: l.maximo } : null;

async function ultimoCalculo(sql: Sql, metrica: Metrica): Promise<ProvenienciaPublicada | null> {
  const [c] = await sql<{ id: string; versao_metodo: string; periodo_inicio: string; periodo_fim: string; calculado_em: Date; coleta_ids: string[] }[]>`
    select id, versao_metodo, to_char(periodo_inicio, 'YYYY-MM-DD') as periodo_inicio, to_char(periodo_fim, 'YYYY-MM-DD') as periodo_fim,
           calculado_em, coleta_ids
      from metrics.calculo where metrica = ${metrica} order by calculado_em desc limit 1`;
  if (!c) return null;
  const [col] = await sql<{ ultima: Date; fontes: string[] }[]>`
    select max(finalizada_em) as ultima, array_agg(distinct fonte_id) as fontes from raw.coleta where id = any(${c.coleta_ids}::uuid[])`;
  return {
    calculoId: c.id,
    metrica,
    versaoMetodo: c.versao_metodo,
    periodo: { inicio: c.periodo_inicio, fim: c.periodo_fim },
    calculadoEm: c.calculado_em.toISOString(),
    coletas: c.coleta_ids.length,
    ultimaColeta: col!.ultima.toISOString(),
    fontes: fontes(col!.fontes),
  };
}

/** O site só carrega imagens do domínio da Câmara (CSP img-src). */
function fotoDaCamara(url: string | null): string | null {
  if (!url) return null;
  const u = new URL(url);
  return u.protocol === 'https:' && u.hostname === 'www.camara.leg.br' ? u.href : null;
}

/** 4 casas bastam para desenhar a distribuição (0,01 ponto percentual). */
const arredondar = (v: number) => Math.round(v * 10_000) / 10_000;

export interface ResultadoPublicacao {
  readonly diretorio: string;
  readonly deputados: number;
  readonly semMetrica: Readonly<Record<Metrica, number>>;
}

export async function publicar(sql: Sql, raiz = raizPublicacaoPadrao()): Promise<ResultadoPublicacao> {
  const geradoEm = new Date().toISOString();
  const [p01, p02, p03] = await Promise.all([ultimoCalculo(sql, 'MET-01'), ultimoCalculo(sql, 'MET-02'), ultimoCalculo(sql, 'MET-03')]);

  const deputados = await sql<{ id_camara: number; nome: string; sigla_partido: string | null; sigla_uf: string; url_foto: string | null; email: string | null; obtido_em: Date }[]>`
    select id_camara, nome, sigla_partido, sigla_uf, url_foto, email, obtido_em from core.deputado where em_exercicio order by nome collate "C"`;
  const resumo = (d: (typeof deputados)[number]): ResumoDeputado => ({
    id: d.id_camara, nome: d.nome, partido: d.sigla_partido, uf: d.sigla_uf, urlFoto: fotoDaCamara(d.url_foto), urlCamara: urlPublicaDeputado(d.id_camara),
  });

  // --- MET-01 ---
  const m01 = new Map<number, { dias: number; presencas: number; presencas_sem_registro_na_sessao: number; ausencias_justificadas: number; ausencias_nao_justificadas: number; taxa_presenca: number | null; entra_na_referencia: boolean }>();
  let ref01: DistribuicaoPublicada | null = null;
  let minDias = 0;
  let taxas01: number[] = [];
  const dias01 = new Map<number, PresencaPublicada['diasDeSessao'][number][]>();
  if (p01) {
    for (const l of await sql<(typeof m01 extends Map<number, infer V> ? V & { id_camara: number } : never)[]>`
        select * from metrics.met01_presenca where calculo_id = ${p01.calculoId}`) m01.set(l.id_camara, l);
    const [r] = await sql<{ n: number; mediana: number; p25: number; p75: number; minimo: number; maximo: number; min_dias: number }[]>`
      select * from metrics.met01_referencia where calculo_id = ${p01.calculoId}`;
    ref01 = dist(r);
    minDias = r?.min_dias ?? 0;
    taxas01 = [...m01.values()].filter((l) => l.entra_na_referencia && l.taxa_presenca !== null).map((l) => l.taxa_presenca!);
    for (const d of await sql<{ id_camara: number; data: string; frequencia: FrequenciaDia; justificativa: string | null }[]>`
        select m.id_camara, to_char(p.data, 'YYYY-MM-DD') as data, p.frequencia, p.justificativa
          from core.presenca_dia p join core.deputado_matricula m using (matricula)
         where p.data between ${p01.periodo.inicio}::date and ${p01.periodo.fim}::date
         order by p.data`) {
      const lista = dias01.get(d.id_camara) ?? [];
      lista.push({ data: d.data, frequencia: d.frequencia, justificativa: d.justificativa });
      dias01.set(d.id_camara, lista);
    }
  }

  // --- MET-02 ---
  type L02 = { id_camara: number; sigla_uf: string; meses_exercicio: number; gasto_centavos: string; teto_centavos: string; percentual_teto: number | null; concentracao_top3: number | null; total_fornecedores: number; entra_na_referencia: boolean };
  const m02 = new Map<number, L02>();
  const ref02 = new Map<string, DistribuicaoPublicada>();
  let minMeses = 0;
  const cat02 = new Map<number, CotaPublicada['categorias'][number][]>();
  const forn02 = new Map<number, CotaPublicada['fornecedores'][number][]>();
  const teto02 = new Map<string, CotaPublicada['valoresBase'][number][]>();
  if (p02) {
    for (const l of await sql<L02[]>`select * from metrics.met02_cota where calculo_id = ${p02.calculoId}`) m02.set(l.id_camara, l);
    for (const r of await sql<{ sigla_uf: string; n: number; media: number; mediana: number; p25: number; p75: number; minimo: number; maximo: number; min_meses: number }[]>`
        select * from metrics.met02_referencia_uf where calculo_id = ${p02.calculoId}`) {
      ref02.set(r.sigla_uf, dist(r)!);
      minMeses = r.min_meses;
    }
    for (const c of await sql<{ id_camara: number; categoria: string; centavos: string }[]>`
        select id_camara, categoria, centavos from metrics.met02_categoria where calculo_id = ${p02.calculoId} order by centavos desc`) {
      cat02.set(c.id_camara, [...(cat02.get(c.id_camara) ?? []), { categoria: c.categoria, centavos: Number(c.centavos) }]);
    }
    for (const f of await sql<{ id_camara: number; fornecedor: string; cnpj: string | null; centavos: string; documentos: number }[]>`
        select id_camara, fornecedor, cnpj, centavos, documentos from metrics.met02_fornecedor where calculo_id = ${p02.calculoId} order by posicao`) {
      forn02.set(f.id_camara, [...(forn02.get(f.id_camara) ?? []), { fornecedor: f.fornecedor, cnpj: f.cnpj, centavos: Number(f.centavos), documentos: f.documentos }]);
    }
    for (const t of await sql<{ sigla_uf: string; mes: string; teto_centavos: string; norma: string; fonte: string }[]>`
        select sigla_uf, mes, teto_centavos, norma, fonte from metrics.met02_teto where calculo_id = ${p02.calculoId} order by mes`) {
      teto02.set(t.sigla_uf, [...(teto02.get(t.sigla_uf) ?? []), { mes: t.mes, centavos: Number(t.teto_centavos), norma: t.norma, fonte: t.fonte }]);
    }
  }

  // --- MET-03 ---
  type L03 = { id_camara: number; apresentadas: number; comissao: number; alem_comissao: number; aprovadas_camara: number; leis: number; apensadas: number; arquivadas: number; retiradas: number; devolvidas: number; taxa_lei: number | null };
  const m03 = new Map<number, L03>();
  const ref03 = new Map<string, DistribuicaoPublicada>();
  const lista03 = new Map<number, ProjetosPublicados['lista'][number][]>();
  if (p03) {
    for (const l of await sql<L03[]>`select * from metrics.met03_funil where calculo_id = ${p03.calculoId}`) m03.set(l.id_camara, l);
    for (const r of await sql<{ indicador: string; n: number; media: number; mediana: number; p25: number; p75: number; minimo: number; maximo: number }[]>`
        select * from metrics.met03_referencia where calculo_id = ${p03.calculoId}`) ref03.set(r.indicador, dist(r)!);
    for (const p of await sql<{ id_camara: number; id_proposicao: number; sigla_tipo: string; numero: number; ano: number; ementa: string; data_apresentacao: string; estagio: EstagioFunil; apensada: boolean; encerrada: ProjetosPublicados['lista'][number]['encerrado']; situacao: string | null }[]>`
        select id_camara, id_proposicao, sigla_tipo, numero, ano, ementa, to_char(data_apresentacao, 'YYYY-MM-DD') as data_apresentacao,
               estagio, apensada, encerrada, situacao
          from metrics.met03_proposicao where calculo_id = ${p03.calculoId} order by data_apresentacao desc, id_proposicao`) {
      lista03.set(p.id_camara, [...(lista03.get(p.id_camara) ?? []), {
        id: p.id_proposicao, sigla: p.sigla_tipo, numero: p.numero, ano: p.ano, ementa: p.ementa, apresentadoEm: p.data_apresentacao,
        estagio: p.estagio, apensado: p.apensada, encerrado: p.encerrada, situacao: p.situacao,
        url: `https://www.camara.leg.br/propostas-legislativas/${p.id_proposicao}`,
      }]);
    }
  }
  const deputadosComLei = [...m03.values()].filter((l) => l.leis > 0).length;

  const temporario = `${raiz}.tmp-${process.pid}-${Date.now()}`;
  await mkdir(join(temporario, 'deputados'), { recursive: true });
  const arquivos: Record<string, string> = {};
  const gravar = async (relativo: string, conteudo: unknown) => {
    const texto = `${JSON.stringify(conteudo)}\n`;
    arquivos[relativo] = createHash('sha256').update(texto).digest('hex');
    await writeFile(join(temporario, relativo), texto);
  };
  const semMetrica: Record<Metrica, number> = { 'MET-01': 0, 'MET-02': 0, 'MET-03': 0 };

  try {
    for (const d of deputados) {
      const id = d.id_camara;

      let presenca: PresencaPublicada | null = null;
      const l01 = m01.get(id);
      if (p01 && l01) {
        const dias = dias01.get(id) ?? [];
        if (dias.length !== l01.dias) {
          throw new Error(`MET-01 inconsistente para ${id}: ${dias.length} dia(s) no bruto, ${l01.dias} no cálculo. Recalcule (pnpm coletar met01) e publique em seguida.`);
        }
        const motivos = new Map<string, number>();
        for (const x of dias) if (x.frequencia === 'Ausência justificada') motivos.set(x.justificativa ?? 'Sem motivo informado', (motivos.get(x.justificativa ?? 'Sem motivo informado') ?? 0) + 1);
        presenca = {
          dias: l01.dias,
          presencas: l01.presencas,
          presencasSemRegistroNaSessao: l01.presencas_sem_registro_na_sessao,
          ausenciasJustificadas: l01.ausencias_justificadas,
          ausenciasNaoJustificadas: l01.ausencias_nao_justificadas,
          taxa: l01.taxa_presenca,
          entraNaReferencia: l01.entra_na_referencia,
          minDiasReferencia: minDias,
          referencia: ref01,
          valoresReferencia: taxas01.map(arredondar).sort((a, b) => a - b),
          posicao: posicaoRelativa(l01.taxa_presenca, taxas01),
          justificativas: [...motivos].map(([motivo, n]) => ({ motivo, dias: n })).sort((a, b) => b.dias - a.dias),
          diasDeSessao: dias,
          urlModeloDia: urlPresencasDia('2000-01-01', LEGISLATURA_ATUAL.id).replace('data=01/01/2000', 'data={DD}/{MM}/{AAAA}'),
          proveniencia: p01,
        };
      } else semMetrica['MET-01']++;

      let cota: CotaPublicada | null = null;
      const l02 = m02.get(id);
      if (p02 && l02) {
        const categorias = cat02.get(id) ?? [];
        const soma = categorias.reduce((t, c) => t + c.centavos, 0);
        if (soma !== Number(l02.gasto_centavos)) {
          throw new Error(`MET-02 inconsistente para ${id}: categorias somam ${soma}, gasto é ${l02.gasto_centavos}.`);
        }
        const valoresUf = [...m02.values()].filter((x) => x.sigla_uf === l02.sigla_uf && x.entra_na_referencia && x.percentual_teto !== null).map((x) => x.percentual_teto!);
        cota = {
          mesesEmExercicio: l02.meses_exercicio,
          gastoCentavos: Number(l02.gasto_centavos),
          valorBaseCentavos: Number(l02.teto_centavos),
          percentual: l02.percentual_teto,
          entraNaReferencia: l02.entra_na_referencia,
          minMesesReferencia: minMeses,
          referenciaUf: ref02.get(l02.sigla_uf) ?? null,
          valoresReferenciaUf: valoresUf.map(arredondar).sort((a, b) => a - b),
          posicaoUf: posicaoRelativa(l02.percentual_teto, valoresUf),
          categorias,
          fornecedores: forn02.get(id) ?? [],
          concentracaoTop3: l02.concentracao_top3,
          totalFornecedores: l02.total_fornecedores,
          valoresBase: teto02.get(l02.sigla_uf) ?? [],
          proveniencia: p02,
        };
      } else semMetrica['MET-02']++;

      let projetos: ProjetosPublicados | null = null;
      const l03 = m03.get(id);
      if (p03 && l03) {
        const lista = lista03.get(id) ?? [];
        if (lista.length !== l03.apresentadas) {
          throw new Error(`MET-03 inconsistente para ${id}: ${lista.length} projeto(s) na lista, ${l03.apresentadas} no funil.`);
        }
        const porEstagio = { apresentada: l03.apresentadas, comissao: l03.comissao, alem_comissao: l03.alem_comissao, aprovada_camara: l03.aprovadas_camara, lei: l03.leis };
        projetos = {
          porEstagio,
          apensados: l03.apensadas,
          arquivados: l03.arquivadas,
          retirados: l03.retiradas,
          devolvidos: l03.devolvidas,
          taxaLei: l03.taxa_lei,
          referencia: {
            porEstagio: Object.fromEntries(ESTAGIOS_FUNIL.map((e) => [e, ref03.get(e) ?? null])) as Record<EstagioFunil, DistribuicaoPublicada | null>,
            taxaLei: ref03.get('taxa_lei') ?? null,
            deputadosComLei,
            totalDeputados: m03.size,
          },
          lista,
          proveniencia: p03,
        };
      } else semMetrica['MET-03']++;

      const publicado: DeputadoPublicado = {
        versao: VERSAO_PUBLICACAO,
        geradoEm,
        deputado: { ...resumo(d), email: d.email, obtidoEm: d.obtido_em.toISOString() },
        presenca,
        cota,
        projetos,
      };
      await gravar(join('deputados', `${id}.json`), publicado);
    }

    const indice: IndicePublicado = { versao: VERSAO_PUBLICACAO, geradoEm, deputados: deputados.map(resumo), arquivos };
    await writeFile(join(temporario, 'indice.json'), `${JSON.stringify(indice)}\n`);

    // Troca atômica: o site nunca lê um snapshot pela metade.
    const antigo = `${raiz}.antigo-${process.pid}`;
    await rename(raiz, antigo).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== 'ENOENT') throw e;
    });
    await rename(temporario, raiz);
    await rm(antigo, { recursive: true, force: true });
  } catch (e) {
    await rm(temporario, { recursive: true, force: true });
    throw e;
  }

  return { diretorio: raiz, deputados: deputados.length, semMetrica };
}
