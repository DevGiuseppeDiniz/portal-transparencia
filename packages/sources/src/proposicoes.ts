// SRC-01b — Câmara, arquivos em massa de proposições (MET-03, funil legislativo).
// docs/fontes/deputado-federal.md#src-01b
//
//   proposicoes-{ano}.csv            proposições apresentadas no ano (situação atual)
//   proposicoesAutores-{ano}.csv     autores das proposições do ano
//   proposicoesTramitacoes-{ano}.csv tramitações OCORRIDAS no ano (de qualquer proposição)
//
// Esses arquivos trazem ~1 registro truncado cada: as linhas inválidas são puladas e
// devolvidas para a coleta registrar (e falhar acima do limite).

import { linhasCsv } from './arquivos.ts';
import { CAMARA_ARQUIVOS, ErroFormato } from './camara.ts';

/** Tipos que entram no funil (MET-03): projeto de lei, de lei complementar e PEC. */
export const TIPOS_FUNIL = ['PL', 'PLP', 'PEC'] as const;
export type TipoFunil = (typeof TIPOS_FUNIL)[number];

export type ConjuntoProposicoes = 'proposicoes' | 'proposicoesAutores' | 'proposicoesTramitacoes' | 'proposicoesTemas';

export function urlArquivoProposicoes(conjunto: ConjuntoProposicoes, ano: number): string {
  if (!Number.isSafeInteger(ano) || ano < 2000 || ano > 2100) throw new ErroFormato(`ano inválido: ${ano}`);
  return `${CAMARA_ARQUIVOS}/${conjunto}/csv/${conjunto}-${ano}.csv`;
}

export interface LeituraCsv<T> {
  readonly itens: T[];
  /** Linhas puladas (número da linha física e motivo). */
  readonly invalidas: ReadonlyArray<{ readonly linha: number; readonly motivo: string }>;
  /** Linhas de dados lidas (válidas + inválidas), para calcular a proporção. */
  readonly total: number;
}

export interface ProposicaoCamara {
  readonly id: number;
  readonly siglaTipo: TipoFunil;
  readonly numero: number;
  readonly ano: number;
  readonly ementa: string;
  /** Resumo em linguagem mais simples, quando a Câmara publica (~7% dos projetos). */
  readonly ementaDetalhada: string | null;
  /** Palavras-chave da indexação da Câmara (sempre presentes). */
  readonly palavrasChave: readonly string[];
  /** Regime de tramitação (ex.: "Urgência (Art. 155, RICD)"). */
  readonly regime: string | null;
  /** Quem decide: só as comissões (conclusiva) ou o Plenário. */
  readonly apreciacao: string | null;
  /** Horário de Brasília, sem fuso. */
  readonly dataApresentacao: string;
  /** Proposição à qual esta foi apensada (id), se houver. */
  readonly idPrincipal: number | null;
  readonly situacao: string | null;
  readonly dataSituacao: string | null;
  readonly urlInteiroTeor: string | null;
}

export interface AutorProposicao {
  readonly idProposicao: number;
  /** null quando o autor não é deputado (órgão, Executivo, Senado…). */
  readonly idDeputado: number | null;
  readonly tipoAutor: string;
  readonly ordemAssinatura: number;
}

export interface TramitacaoCamara {
  readonly idProposicao: number;
  readonly dataHora: string;
  /** Vem vazia em raros registros. */
  readonly sequencia: number | null;
  readonly siglaOrgao: string;
  readonly descricao: string;
  readonly codSituacao: number | null;
}

const ID_EM_URI = /\/proposicoes\/(\d+)$/;
const DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

function idDaUri(uri: string, onde: string): number {
  const m = ID_EM_URI.exec(uri.trim());
  if (!m) throw new ErroFormato(`${onde}: URI de proposição inesperada "${uri.slice(0, 80)}"`);
  return Number(m[1]);
}

function inteiro(v: string | undefined, onde: string): number {
  const t = (v ?? '').trim();
  if (!/^\d+$/.test(t)) throw new ErroFormato(`${onde}: inteiro inválido "${t.slice(0, 30)}"`);
  return Number(t);
}

function dataHora(v: string | undefined, onde: string): string {
  const t = (v ?? '').trim();
  if (!DATA_HORA.test(t)) throw new ErroFormato(`${onde}: data/hora inválida "${t.slice(0, 30)}"`);
  return t.slice(0, 19);
}

/**
 * Lê um CSV em massa: cada linha passa por `ler`; ErroFormato numa linha a torna inválida
 * (pulada e informada), como as linhas truncadas.
 */
function lerLinhas<T>(texto: string, colunas: readonly string[], ler: (l: Record<string, string>, onde: string) => T | null): LeituraCsv<T> {
  const itens: T[] = [];
  const invalidas: Array<{ linha: number; motivo: string }> = [];
  let total = 0;
  let primeira = true;
  for (const l of linhasCsv(texto, ';', { aoLinhaInvalida: (linha, motivo) => (total++, invalidas.push({ linha, motivo })) })) {
    if (primeira) {
      const faltando = colunas.filter((c) => !(c in l));
      if (faltando.length) throw new ErroFormato(`arquivo sem as colunas: ${faltando.join(', ')}`);
      primeira = false;
    }
    total++;
    try {
      const item = ler(l, `linha ${total + 1}`);
      if (item !== null) itens.push(item);
    } catch (e) {
      if (!(e instanceof ErroFormato)) throw e;
      invalidas.push({ linha: total + 1, motivo: e.message });
    }
  }
  return { itens, invalidas, total };
}

/** Só PL, PLP e PEC (TIPOS_FUNIL); as demais linhas são ignoradas, não inválidas. */
export function lerProposicoesCsv(texto: string): LeituraCsv<ProposicaoCamara> {
  const colunas = ['id', 'siglaTipo', 'numero', 'ano', 'ementa', 'ementaDetalhada', 'keywords', 'dataApresentacao', 'uriPropPrincipal', 'ultimoStatus_descricaoSituacao', 'ultimoStatus_dataHora', 'ultimoStatus_regime', 'ultimoStatus_apreciacao', 'urlInteiroTeor'];
  return lerLinhas(texto, colunas, (l, onde) => {
    const tipo = (l['siglaTipo'] ?? '').trim();
    if (!(TIPOS_FUNIL as readonly string[]).includes(tipo)) return null;
    const principal = (l['uriPropPrincipal'] ?? '').trim();
    const situacao = (l['ultimoStatus_descricaoSituacao'] ?? '').trim();
    const dataSituacao = (l['ultimoStatus_dataHora'] ?? '').trim();
    const teor = (l['urlInteiroTeor'] ?? '').trim();
    let urlInteiroTeor: string | null = null;
    if (teor) {
      const u = new URL(teor);
      if (u.protocol !== 'https:' || u.hostname !== 'www.camara.leg.br') throw new ErroFormato(`${onde}: urlInteiroTeor fora da Câmara`);
      urlInteiroTeor = u.href;
    }
    return {
      id: inteiro(l['id'], `${onde}.id`),
      siglaTipo: tipo as TipoFunil,
      numero: inteiro(l['numero'], `${onde}.numero`),
      ano: inteiro(l['ano'], `${onde}.ano`),
      ementa: (l['ementa'] ?? '').trim().slice(0, 2000),
      ementaDetalhada: (l['ementaDetalhada'] ?? '').trim().slice(0, 2000) || null,
      palavrasChave: separarPalavrasChave(l['keywords'] ?? ''),
      regime: (l['ultimoStatus_regime'] ?? '').trim().slice(0, 200) || null,
      apreciacao: (l['ultimoStatus_apreciacao'] ?? '').trim().slice(0, 200) || null,
      dataApresentacao: dataHora(l['dataApresentacao'], `${onde}.dataApresentacao`),
      idPrincipal: principal ? idDaUri(principal, `${onde}.uriPropPrincipal`) : null,
      situacao: situacao || null,
      dataSituacao: dataSituacao ? dataHora(dataSituacao, `${onde}.ultimoStatus_dataHora`) : null,
      urlInteiroTeor,
    };
  });
}

/**
 * Palavras-chave da Câmara: separadas por vírgula ou ponto final, às vezes com a primeira
 * maiúscula ("Alteração, Estatuto do Desarmamento, ... uso restrito."). Mantém siglas e nomes
 * próprios; descarta repetidas e termos genéricos de técnica legislativa.
 */
const GENERICAS = new Set(['alteração', 'critério', 'normas', 'exigência', 'definição', 'criação', 'inclusão', 'acréscimo', 'regulamentação']);
export function separarPalavrasChave(bruto: string): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const parte of bruto.split(/[,.;](?=\s|$)/)) {
    const t = parte.replace(/\s+/g, ' ').trim();
    if (t.length < 3 || t.length > 80) continue;
    const chave = t.toLocaleLowerCase('pt-BR');
    if (GENERICAS.has(chave) || vistos.has(chave)) continue;
    vistos.add(chave);
    saida.push(t);
    if (saida.length >= 12) break;
  }
  return saida;
}

export interface TemaProposicao {
  readonly idProposicao: number;
  readonly codTema: number;
  readonly tema: string;
}

/** Temas oficiais da Câmara (31 áreas), uma linha por proposição × tema. */
export function lerTemasCsv(texto: string): LeituraCsv<TemaProposicao> {
  const colunas = ['uriProposicao', 'codTema', 'tema'];
  return lerLinhas(texto, colunas, (l, onde) => ({
    idProposicao: idDaUri(l['uriProposicao'] ?? '', `${onde}.uriProposicao`),
    codTema: inteiro(l['codTema'], `${onde}.codTema`),
    tema: (l['tema'] ?? '').trim().slice(0, 120),
  }));
}

/** Só quem assina como proponente (autores e coautores). */
export function lerAutoresCsv(texto: string): LeituraCsv<AutorProposicao> {
  const colunas = ['idProposicao', 'idDeputadoAutor', 'tipoAutor', 'ordemAssinatura', 'proponente'];
  return lerLinhas(texto, colunas, (l, onde) => {
    if ((l['proponente'] ?? '').trim() !== '1') return null;
    const dep = (l['idDeputadoAutor'] ?? '').trim();
    return {
      idProposicao: inteiro(l['idProposicao'], `${onde}.idProposicao`),
      idDeputado: dep ? inteiro(dep, `${onde}.idDeputadoAutor`) : null,
      tipoAutor: (l['tipoAutor'] ?? '').trim().slice(0, 100),
      ordemAssinatura: inteiro(l['ordemAssinatura'], `${onde}.ordemAssinatura`),
    };
  });
}

export function lerTramitacoesCsv(texto: string): LeituraCsv<TramitacaoCamara> {
  const colunas = ['uriProposicao', 'dataHora', 'sequencia', 'siglaOrgao', 'descricaoTramitacao', 'codSituacao'];
  return lerLinhas(texto, colunas, (l, onde) => {
    const cod = (l['codSituacao'] ?? '').trim();
    const seq = (l['sequencia'] ?? '').trim();
    return {
      idProposicao: idDaUri(l['uriProposicao'] ?? '', `${onde}.uriProposicao`),
      dataHora: dataHora(l['dataHora'], `${onde}.dataHora`),
      sequencia: seq ? inteiro(seq, `${onde}.sequencia`) : null,
      siglaOrgao: (l['siglaOrgao'] ?? '').trim().slice(0, 50),
      descricao: (l['descricaoTramitacao'] ?? '').trim().slice(0, 300),
      codSituacao: cod ? inteiro(cod, `${onde}.codSituacao`) : null,
    };
  });
}
