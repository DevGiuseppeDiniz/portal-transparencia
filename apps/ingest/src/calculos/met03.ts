// Cálculo da MET-03 (docs/04-metricas.md#met-03): funil dos projetos de autoria principal
// de cada deputado em exercício, apresentados na legislatura atual. Conta em @portal/metrics.

import type { Sql } from '@portal/db';
import {
  ESTAGIOS_FUNIL,
  MET03_VERSAO,
  calcularFunil,
  classificarProposicao,
  referenciaFunil,
  type ClassificacaoProposicao,
  type TramitacaoFunil,
} from '@portal/metrics';
import { LEGISLATURA_ATUAL } from '@portal/sources';
import { fatiar } from '../coleta.ts';

export interface ResultadoMet03 {
  readonly calculoId: string;
  readonly deputados: number;
  readonly proposicoes: number;
  readonly medianaLei: number | null;
}

export async function calcularMet03(sql: Sql, versaoCalculo: string): Promise<ResultadoMet03 | null> {
  const vigentes = await sql<{ chave: string; coleta_id: string }[]>`
    select chave, coleta_id from core.coleta_vigente
     where chave like 'proposicoes:%' or chave like 'proposicoesAutores:%' or chave like 'proposicoesTramitacoes:%'`;
  const de = (prefixo: string) => vigentes.filter((v) => v.chave.startsWith(`${prefixo}:`)).map((v) => v.coleta_id);
  const [cProp, cAut, cTram] = [de('proposicoes'), de('proposicoesAutores'), de('proposicoesTramitacoes')];
  if (!cProp.length || !cAut.length || !cTram.length) {
    throw new Error('MET-03 sem coletas vigentes de proposições, autores e tramitações (rode a etapa proposicoes)');
  }

  const deputados = await sql<{ id_camara: number; coleta_id: string }[]>`select id_camara, coleta_id from core.deputado where em_exercicio`;
  if (!deputados.length) return null;
  const emExercicio = new Set(deputados.map((d) => d.id_camara));

  // Autor principal (ordem 1) deputado, PL/PLP/PEC apresentado na legislatura atual.
  const proposicoes = await sql<{
    id_proposicao: number; id_deputado: number; sigla_tipo: 'PL' | 'PLP' | 'PEC'; numero: number; ano: number;
    ementa: string; data_apresentacao: string; id_principal: number | null; situacao: string | null;
  }[]>`
    select distinct on (p.id_proposicao)
           p.id_proposicao, a.id_deputado, p.sigla_tipo, p.numero, p.ano, p.ementa,
           to_char(p.data_apresentacao, 'YYYY-MM-DD"T"HH24:MI:SS') as data_apresentacao, p.id_principal, p.situacao
      from staging.camara_proposicao p
      join staging.camara_proposicao_autor a
        on a.id_proposicao = p.id_proposicao and a.coleta_id in ${sql(cAut)} and a.ordem_assinatura = 1 and a.id_deputado is not null
     where p.coleta_id in ${sql(cProp)}
       and p.data_apresentacao >= ${LEGISLATURA_ATUAL.inicio}::date
     order by p.id_proposicao, p.obtido_em desc`;

  const tramitacoes = new Map<number, TramitacaoFunil[]>();
  for (const t of await sql<{ id_proposicao: number; sigla_orgao: string; descricao: string }[]>`
      select id_proposicao, sigla_orgao, descricao from staging.camara_tramitacao where coleta_id in ${sql(cTram)}`) {
    const lista = tramitacoes.get(t.id_proposicao) ?? [];
    lista.push({ siglaOrgao: t.sigla_orgao, descricao: t.descricao });
    tramitacoes.set(t.id_proposicao, lista);
  }

  type Item = ClassificacaoProposicao & { p: (typeof proposicoes)[number] };
  const porDeputado = new Map<number, Item[]>(deputados.map((d) => [d.id_camara, []]));
  for (const p of proposicoes) {
    if (!emExercicio.has(p.id_deputado)) continue;
    const c = classificarProposicao({
      siglaTipo: p.sigla_tipo, situacao: p.situacao, apensadaA: p.id_principal, tramitacoes: tramitacoes.get(p.id_proposicao) ?? [],
    });
    porDeputado.get(p.id_deputado)!.push({ ...c, p });
  }

  const funis = [...porDeputado].map(([id, itens]) => ({ id, funil: calcularFunil(itens), itens }));
  const referencia = referenciaFunil(funis.map((f) => f.funil));
  const coletas = [...new Set([...cProp, ...cAut, ...cTram, ...deputados.map((d) => d.coleta_id)])];
  const fim = new Date().toISOString().slice(0, 10);

  return sql.begin(async (tx) => {
    const [calculo] = await tx<{ id: string }[]>`
      insert into metrics.calculo (metrica, versao_metodo, periodo_inicio, periodo_fim, coleta_ids, versao_calculo)
      values ('MET-03', ${MET03_VERSAO}, ${LEGISLATURA_ATUAL.inicio}, ${fim}, ${coletas}::uuid[], ${versaoCalculo})
      returning id`;
    const calculoId = calculo!.id;

    for (const lote of fatiar(funis, 500)) {
      await tx`insert into metrics.met03_funil ${tx(
        lote.map(({ id, funil }) => ({
          calculo_id: calculoId,
          id_camara: id,
          apresentadas: funil.porEstagio.apresentada,
          comissao: funil.porEstagio.comissao,
          alem_comissao: funil.porEstagio.alem_comissao,
          aprovadas_camara: funil.porEstagio.aprovada_camara,
          leis: funil.porEstagio.lei,
          apensadas: funil.apensadas,
          arquivadas: funil.arquivadas,
          retiradas: funil.retiradas,
          devolvidas: funil.devolvidas,
          taxa_lei: funil.taxaLei,
        })),
      )}`;
    }

    const refs = [
      ...ESTAGIOS_FUNIL.map((e) => [e, referencia.porEstagio[e]] as const),
      ['taxa_lei', referencia.taxaLei] as const,
    ].flatMap(([indicador, d]) =>
      d ? [{ calculo_id: calculoId, indicador, n: d.n, media: d.media, mediana: d.mediana, p25: d.p25, p75: d.p75, minimo: d.minimo, maximo: d.maximo }] : [],
    );
    if (refs.length) await tx`insert into metrics.met03_referencia ${tx(refs)}`;

    const linhas = funis.flatMap(({ id, itens }) =>
      itens.map((i) => ({
        calculo_id: calculoId,
        id_camara: id,
        id_proposicao: i.p.id_proposicao,
        sigla_tipo: i.p.sigla_tipo,
        numero: i.p.numero,
        ano: i.p.ano,
        ementa: i.p.ementa,
        data_apresentacao: i.p.data_apresentacao,
        estagio: i.estagio,
        apensada: i.apensada,
        encerrada: i.encerrada,
        situacao: i.p.situacao,
      })),
    );
    for (const lote of fatiar(linhas, 2000)) await tx`insert into metrics.met03_proposicao ${tx(lote)}`;

    return { calculoId, deputados: funis.length, proposicoes: linhas.length, medianaLei: referencia.taxaLei?.mediana ?? null };
  });
}
