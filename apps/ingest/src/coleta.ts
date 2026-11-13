// Ciclo de vida de uma coleta (raw.coleta, DEC-10), comum a todos os coletores:
//   abrir (em_andamento, antes de qualquer HTTP) → baixar → salvar o bruto → gravar → fechar.

import type { Sql, TransacaoSql } from '@portal/db';
import { ErroHttp, obter, type OpcoesHttp, type RespostaBruta } from '@portal/sources';
import type { ArmazenamentoRaw, ObjetoRaw } from './raw.ts';

export type StatusFinal = 'sucesso' | 'parcial' | 'falha';

export interface ResultadoColeta {
  readonly coletaId: string;
  readonly status: StatusFinal;
  readonly registros: number;
  readonly raw: ObjetoRaw | null;
  readonly erro: string | null;
}

export interface Dependencias {
  readonly sql: Sql;
  readonly raw: ArmazenamentoRaw;
  readonly versao: string;
  readonly http?: OpcoesHttp;
  readonly agora?: () => Date;
}

export async function abrirColeta(sql: Sql, fonteId: string, url: string, versao: string): Promise<string> {
  const [linha] = await sql<{ id: string }[]>`
    insert into raw.coleta (fonte_id, url_requisitada, metodo, versao_coletor)
    values (${fonteId}, ${url}, 'api', ${versao})
    returning id`;
  return linha!.id;
}

export async function fecharColeta(
  sql: Sql | TransacaoSql,
  coletaId: string,
  status: StatusFinal,
  objeto: ObjetoRaw | null,
  statusHttp: number | null,
  registros: number,
  erro: string | null,
): Promise<ResultadoColeta> {
  await sql`
    update raw.coleta set
      status = ${status},
      finalizada_em = now(),
      status_http = ${statusHttp},
      hash_conteudo = ${objeto?.hash ?? null},
      caminho_raw = ${objeto?.caminho ?? null},
      registros = ${registros},
      erro = ${erro}
    where id = ${coletaId}`;
  return { coletaId, status, registros, raw: objeto, erro };
}

/** O pacote bruto: cada resposta com URL exata, status, cabeçalhos relevantes e o corpo original. */
export async function salvarPacote(
  raw: ArmazenamentoRaw,
  fonteId: string,
  coletaId: string,
  urlRequisitada: string,
  paginas: readonly RespostaBruta[],
  em: Date,
): Promise<ObjetoRaw> {
  return raw.salvar(fonteId, JSON.stringify({ fonteId, coletaId, urlRequisitada, paginas }), em);
}

export function descreverErro(e: unknown): string {
  return e instanceof Error ? `${e.name}: ${e.message}` : String(e);
}

export interface Gravacao {
  readonly registros: number;
  /** Motivo para a coleta ser só parcial; null = sucesso. */
  readonly parcial?: string | null;
}

/**
 * Coleta de uma URL só (sem paginação): baixa, guarda o bruto, interpreta e grava numa
 * transação que também fecha a coleta. Erro em qualquer etapa fecha como `falha`, com o
 * bruto guardado se o download aconteceu.
 */
export async function coletarUrl<T>(
  deps: Dependencias,
  fonteId: string,
  url: string,
  ler: (corpo: string) => T,
  gravar: (tx: TransacaoSql, dados: T, ctx: { coletaId: string; obtidoEm: Date }) => Promise<Gravacao>,
): Promise<ResultadoColeta> {
  const { sql, raw, versao, http = {}, agora = () => new Date() } = deps;
  const coletaId = await abrirColeta(sql, fonteId, url, versao);

  let resposta: RespostaBruta;
  try {
    resposta = await obter(url, http);
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', null, e instanceof ErroHttp ? e.status : null, 0, descreverErro(e));
  }

  let objeto: ObjetoRaw;
  try {
    objeto = await salvarPacote(raw, fonteId, coletaId, url, [resposta], agora());
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', null, resposta.status, 0, `falha ao salvar o raw: ${descreverErro(e)}`);
  }

  let dados: T;
  try {
    dados = ler(resposta.corpo);
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', objeto, resposta.status, 0, descreverErro(e));
  }

  const obtidoEm = new Date(resposta.recebidaEm);
  try {
    return await sql.begin(async (tx) => {
      const g = await gravar(tx, dados, { coletaId, obtidoEm });
      const parcial = g.parcial ?? null;
      return fecharColeta(tx, coletaId, parcial ? 'parcial' : 'sucesso', objeto, resposta.status, g.registros, parcial);
    });
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', objeto, resposta.status, 0, `falha ao gravar: ${descreverErro(e)}`);
  }
}

export function fatiar<T>(itens: readonly T[], tamanho: number): T[][] {
  const fatias: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) fatias.push(itens.slice(i, i + tamanho));
  return fatias;
}
