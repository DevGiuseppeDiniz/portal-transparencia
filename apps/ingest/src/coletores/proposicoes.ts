// Coletores da MET-03 (funil legislativo): arquivos anuais de proposições, autores e
// tramitações (SRC-01b). Ordem importa: proposições → autores → tramitações, porque os dois
// últimos são recortados pelas proposições do funil (o raw guarda o arquivo inteiro).

import {
  ErroHttp,
  LEGISLATURA_ATUAL,
  lerAutoresCsv,
  lerProposicoesCsv,
  lerTemasCsv,
  lerTramitacoesCsv,
  obterBytes,
  urlArquivoProposicoes,
  type ConjuntoProposicoes,
  type LeituraCsv,
} from '@portal/sources';
import type { TransacaoSql } from '@portal/db';
import { abrirColeta, descreverErro, fatiar, fecharColeta, type Dependencias, type ResultadoColeta } from '../coleta.ts';
import type { ObjetoRaw } from '../raw.ts';

const FONTE = 'SRC-01b';
/** Linhas malformadas no meio do arquivo: toleradas até este limite, e registradas na coleta. */
export const MAX_PROPORCAO_INVALIDAS = 0.0001;
const MAX_INVALIDAS_ABSOLUTO = 20;

export const chaveArquivo = (conjunto: ConjuntoProposicoes, ano: number) => `${conjunto}:${ano}`;

export function anosDaLegislatura(hoje = new Date()): number[] {
  const anos: number[] = [];
  for (let a = Number(LEGISLATURA_ATUAL.inicio.slice(0, 4)); a <= hoje.getUTCFullYear(); a++) anos.push(a);
  return anos;
}

/** Aceita as linhas inválidas? Devolve o aviso para a coleta, ou lança se passou do limite. */
export function avaliarInvalidas(leitura: LeituraCsv<unknown>): string | null {
  const n = leitura.invalidas.length;
  if (n === 0) return null;
  // Registro cortado na ÚLTIMA linha = download ou arquivo incompleto (a conexão com o
  // servidor da Câmara cai no meio às vezes). Nunca é aceitável: faltariam linhas sem aviso.
  const fim = leitura.invalidas.find((i) => i.motivo.includes('fim do arquivo'));
  if (fim) throw new Error(`arquivo incompleto: registro cortado na linha ${fim.linha} (fim do arquivo)`);
  const linhas = leitura.invalidas.slice(0, 10).map((i) => `${i.linha} (${i.motivo})`).join('; ');
  if (n > MAX_INVALIDAS_ABSOLUTO || n / Math.max(1, leitura.total) > MAX_PROPORCAO_INVALIDAS) {
    throw new Error(`${n} linha(s) inválida(s) de ${leitura.total}, acima do limite: ${linhas}`);
  }
  return `aviso: ${n} linha(s) malformada(s) no arquivo oficial, ignorada(s): ${linhas}`;
}

type Gravador = (tx: TransacaoSql, bytes: Buffer, ctx: { coletaId: string; obtidoEm: Date; url: string }) => Promise<{ registros: number; aviso: string | null }>;

async function coletarArquivo(deps: Dependencias, conjunto: ConjuntoProposicoes, ano: number, gravar: Gravador): Promise<ResultadoColeta> {
  const { sql, raw, versao, http = {}, agora = () => new Date() } = deps;
  const url = urlArquivoProposicoes(conjunto, ano);
  const chave = chaveArquivo(conjunto, ano);
  const coletaId = await abrirColeta(sql, FONTE, url, versao);

  let bytes: Buffer;
  let statusHttp: number;
  let recebidaEm: string;
  try {
    ({ bytes, status: statusHttp, recebidaEm } = await obterBytes(url, http));
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', null, e instanceof ErroHttp ? e.status : null, 0, descreverErro(e));
  }

  let objeto: ObjetoRaw;
  try {
    objeto = await raw.salvarArquivo(FONTE, bytes, 'csv', agora());
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', null, statusHttp, 0, `falha ao salvar o raw: ${descreverErro(e)}`);
  }

  const [vigente] = await sql<{ hash_conteudo: string; registros: number }[]>`
    select c.hash_conteudo, c.registros from core.coleta_vigente v join raw.coleta c on c.id = v.coleta_id where v.chave = ${chave}`;
  if (vigente?.hash_conteudo === objeto.hash) {
    return fecharColeta(sql, coletaId, 'sucesso', objeto, statusHttp, vigente.registros, null);
  }

  try {
    return await sql.begin(async (tx) => {
      const { registros, aviso } = await gravar(tx, bytes, { coletaId, obtidoEm: new Date(recebidaEm), url });
      await tx`
        insert into core.coleta_vigente (chave, coleta_id, obtido_em) values (${chave}, ${coletaId}, ${new Date(recebidaEm)})
        on conflict (chave) do update set coleta_id = excluded.coleta_id, obtido_em = excluded.obtido_em`;
      return fecharColeta(tx, coletaId, 'sucesso', objeto, statusHttp, registros, aviso);
    });
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', objeto, statusHttp, 0, descreverErro(e));
  }
}

export function coletarProposicoes(deps: Dependencias, ano: number): Promise<ResultadoColeta> {
  return coletarArquivo(deps, 'proposicoes', ano, async (tx, bytes, { coletaId, obtidoEm }) => {
    const leitura = lerProposicoesCsv(bytes.toString('utf8'));
    const aviso = avaliarInvalidas(leitura);
    for (const lote of fatiar(leitura.itens, 2000)) {
      await tx`insert into staging.camara_proposicao ${tx(
        lote.map((p) => ({
          coleta_id: coletaId,
          fonte_id: FONTE,
          obtido_em: obtidoEm,
          url_origem_publica: `https://www.camara.leg.br/propostas-legislativas/${p.id}`,
          id_proposicao: p.id,
          sigla_tipo: p.siglaTipo,
          numero: p.numero,
          ano: p.ano,
          ementa: p.ementa,
          ementa_detalhada: p.ementaDetalhada,
          palavras_chave: p.palavrasChave as string[],
          regime: p.regime,
          apreciacao: p.apreciacao,
          data_apresentacao: p.dataApresentacao,
          id_principal: p.idPrincipal,
          situacao: p.situacao,
          data_situacao: p.dataSituacao,
          url_inteiro_teor: p.urlInteiroTeor,
        })),
      )}`;
    }
    return { registros: leitura.itens.length, aviso };
  });
}

/** Ids das proposições do funil (todas as vigentes), para recortar autores e tramitações. */
async function idsDoFunil(tx: TransacaoSql): Promise<Set<number>> {
  const linhas = await tx<{ id_proposicao: number }[]>`
    select distinct id_proposicao from staging.camara_proposicao
     where coleta_id in (select coleta_id from core.coleta_vigente where chave like 'proposicoes:%')`;
  return new Set(linhas.map((l) => l.id_proposicao));
}

export function coletarAutores(deps: Dependencias, ano: number): Promise<ResultadoColeta> {
  return coletarArquivo(deps, 'proposicoesAutores', ano, async (tx, bytes, { coletaId, obtidoEm }) => {
    const leitura = lerAutoresCsv(bytes.toString('utf8'));
    const aviso = avaliarInvalidas(leitura);
    const ids = await idsDoFunil(tx);
    const itens = leitura.itens.filter((a) => ids.has(a.idProposicao));
    let linha = 0;
    for (const lote of fatiar(itens, 3000)) {
      await tx`insert into staging.camara_proposicao_autor ${tx(
        lote.map((a) => ({
          coleta_id: coletaId,
          fonte_id: FONTE,
          obtido_em: obtidoEm,
          linha: ++linha,
          id_proposicao: a.idProposicao,
          id_deputado: a.idDeputado,
          tipo_autor: a.tipoAutor,
          ordem_assinatura: a.ordemAssinatura,
        })),
      )}`;
    }
    return { registros: itens.length, aviso };
  });
}

/** Guarda as tramitações das proposições do funil. */
export function coletarTramitacoes(deps: Dependencias, ano: number): Promise<ResultadoColeta> {
  return coletarArquivo(deps, 'proposicoesTramitacoes', ano, async (tx, bytes, { coletaId, obtidoEm }) => {
    const leitura = lerTramitacoesCsv(bytes.toString('utf8'));
    const aviso = avaliarInvalidas(leitura);
    const ids = await idsDoFunil(tx);
    const itens = leitura.itens.filter((t) => ids.has(t.idProposicao));
    let linha = 0;
    for (const lote of fatiar(itens, 3000)) {
      await tx`insert into staging.camara_tramitacao ${tx(
        lote.map((t) => ({
          coleta_id: coletaId,
          fonte_id: FONTE,
          obtido_em: obtidoEm,
          linha: ++linha,
          id_proposicao: t.idProposicao,
          data_hora: t.dataHora,
          sequencia: t.sequencia,
          sigla_orgao: t.siglaOrgao,
          descricao: t.descricao,
          cod_situacao: t.codSituacao,
        })),
      )}`;
    }
    return { registros: itens.length, aviso };
  });
}

/** Temas oficiais (Saúde, Educação…) das proposições do funil. */
export function coletarTemas(deps: Dependencias, ano: number): Promise<ResultadoColeta> {
  return coletarArquivo(deps, 'proposicoesTemas', ano, async (tx, bytes, { coletaId, obtidoEm }) => {
    const leitura = lerTemasCsv(bytes.toString('utf8'));
    const aviso = avaliarInvalidas(leitura);
    const ids = await idsDoFunil(tx);
    const itens = leitura.itens.filter((t) => ids.has(t.idProposicao));
    let linha = 0;
    for (const lote of fatiar(itens, 3000)) {
      await tx`insert into staging.camara_proposicao_tema ${tx(
        lote.map((t) => ({
          coleta_id: coletaId,
          fonte_id: FONTE,
          obtido_em: obtidoEm,
          linha: ++linha,
          id_proposicao: t.idProposicao,
          cod_tema: t.codTema,
          tema: t.tema,
        })),
      )}`;
    }
    return { registros: itens.length, aviso };
  });
}
