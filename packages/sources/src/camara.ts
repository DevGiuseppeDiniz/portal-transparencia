// SRC-01 — Câmara dos Deputados, API Dados Abertos v2 (docs/fontes/deputado-federal.md#src-01).
//
// Conteúdo vindo da fonte é não confiável (SEG-06): todo campo é validado aqui. Formato
// inesperado é erro (ErroFormato), não "melhor esforço": se a Câmara mudar a API, a coleta
// falha e fica registrada, em vez de gravar dado errado.

export const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';
const ORIGEM_API = new URL(CAMARA_API).origin;
/** Máximo aceito pela API (docs/fontes/deputado-federal.md#src-01). */
export const ITENS_POR_PAGINA = 100;

export const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const;
export type Uf = (typeof UFS)[number];

export class ErroFormato extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroFormato';
  }
}

export interface DeputadoCamara {
  readonly id: number;
  readonly nome: string;
  readonly siglaPartido: string | null;
  readonly siglaUf: Uf;
  readonly idLegislatura: number;
  readonly urlFoto: string | null;
  readonly email: string | null;
}

export interface PaginaCamara<T> {
  readonly dados: readonly T[];
  /** URL da próxima página, já validada (mesma origem da API), ou null na última. */
  readonly proxima: string | null;
}

/** Lista de deputados em exercício. Ordenada para a paginação ser estável. */
export function urlDeputadosEmExercicio(): string {
  return `${CAMARA_API}/deputados?itens=${ITENS_POR_PAGINA}&ordem=ASC&ordenarPor=nome`;
}

/** Página pública do deputado no site da Câmara: o link "conferir na fonte" (DEC-07). */
export function urlPublicaDeputado(id: number): string {
  return `https://www.camara.leg.br/deputados/${id}`;
}

function objeto(valor: unknown, onde: string): Record<string, unknown> {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new ErroFormato(`${onde}: esperado objeto`);
  }
  return valor as Record<string, unknown>;
}

function inteiroPositivo(valor: unknown, onde: string): number {
  if (typeof valor !== 'number' || !Number.isSafeInteger(valor) || valor <= 0) {
    throw new ErroFormato(`${onde}: esperado inteiro positivo, veio ${JSON.stringify(valor)}`);
  }
  return valor;
}

function texto(valor: unknown, onde: string, max: number): string {
  if (typeof valor !== 'string' || valor.trim() === '' || valor.length > max) {
    throw new ErroFormato(`${onde}: esperado texto não vazio de até ${max} caracteres`);
  }
  return valor.trim();
}

/** null, ausente e "" viram null. */
function textoOpcional(valor: unknown, onde: string, max: number): string | null {
  if (valor === null || valor === undefined || valor === '') return null;
  return texto(valor, onde, max);
}

function urlHttpsOpcional(valor: unknown, onde: string): string | null {
  const bruto = textoOpcional(valor, onde, 500);
  if (bruto === null) return null;
  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    throw new ErroFormato(`${onde}: URL inválida`);
  }
  // Só https: o valor vai para um <img src> no app (SEG-06).
  if (url.protocol !== 'https:') throw new ErroFormato(`${onde}: URL não é https`);
  return url.href;
}

function lerDeputado(valor: unknown, onde: string): DeputadoCamara {
  const o = objeto(valor, onde);
  const uf = texto(o['siglaUf'], `${onde}.siglaUf`, 2);
  if (!(UFS as readonly string[]).includes(uf)) throw new ErroFormato(`${onde}.siglaUf: UF desconhecida "${uf}"`);
  const email = textoOpcional(o['email'], `${onde}.email`, 200);
  if (email !== null && !/^[^\s@]+@[^\s@]+$/.test(email)) throw new ErroFormato(`${onde}.email: formato inválido`);
  return {
    id: inteiroPositivo(o['id'], `${onde}.id`),
    nome: texto(o['nome'], `${onde}.nome`, 200),
    siglaPartido: textoOpcional(o['siglaPartido'], `${onde}.siglaPartido`, 30),
    siglaUf: uf as Uf,
    idLegislatura: inteiroPositivo(o['idLegislatura'], `${onde}.idLegislatura`),
    urlFoto: urlHttpsOpcional(o['urlFoto'], `${onde}.urlFoto`),
    email,
  };
}

/** Lê o link rel="next" do corpo e só aceita URL da própria API (não segue link arbitrário). */
function lerProxima(links: unknown): string | null {
  if (links === undefined) return null;
  if (!Array.isArray(links)) throw new ErroFormato('links: esperado lista');
  const next = links.map((l, i) => objeto(l, `links[${i}]`)).find((l) => l['rel'] === 'next');
  if (!next) return null;
  const href = texto(next['href'], 'links.next.href', 2000);
  const url = new URL(href);
  if (url.origin !== ORIGEM_API || !url.pathname.startsWith('/api/v2/')) {
    throw new ErroFormato(`links.next.href fora da API da Câmara: ${url.origin}${url.pathname}`);
  }
  return url.href;
}

export function lerPaginaDeputados(corpo: string): PaginaCamara<DeputadoCamara> {
  let json: unknown;
  try {
    json = JSON.parse(corpo);
  } catch {
    throw new ErroFormato('corpo não é JSON');
  }
  const raiz = objeto(json, 'resposta');
  if (!Array.isArray(raiz['dados'])) throw new ErroFormato('resposta.dados: esperado lista');
  return {
    dados: raiz['dados'].map((d, i) => lerDeputado(d, `dados[${i}]`)),
    proxima: lerProxima(raiz['links']),
  };
}

// --- SRC-01b: arquivos em massa ---------------------------------------------------------

export const CAMARA_ARQUIVOS = 'https://dadosabertos.camara.leg.br/arquivos';

export interface EventoCamara {
  readonly id: number;
  /** Como a Câmara publica: horário de Brasília, sem fuso (AAAA-MM-DDTHH:MM[:SS]). */
  readonly dataHoraInicio: string;
  readonly descricaoTipo: string;
  readonly situacao: string | null;
  readonly local: string | null;
}

export function urlEventosAno(ano: number): string {
  if (!Number.isSafeInteger(ano) || ano < 2000 || ano > 2100) throw new ErroFormato(`ano inválido: ${ano}`);
  return `${CAMARA_ARQUIVOS}/eventos/json/eventos-${ano}.json`;
}

export function lerArquivoEventos(corpo: string): EventoCamara[] {
  let json: unknown;
  try {
    json = JSON.parse(corpo);
  } catch {
    throw new ErroFormato('arquivo de eventos não é JSON');
  }
  const dados = objeto(json, 'arquivo')['dados'];
  if (!Array.isArray(dados)) throw new ErroFormato('arquivo.dados: esperado lista');
  return dados.map((valor, i) => {
    const onde = `dados[${i}]`;
    const o = objeto(valor, onde);
    const inicio = texto(o['dataHoraInicio'], `${onde}.dataHoraInicio`, 19);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(inicio)) {
      throw new ErroFormato(`${onde}.dataHoraInicio: formato inesperado "${inicio}"`);
    }
    const local = o['localCamara'] === null || o['localCamara'] === undefined ? null : objeto(o['localCamara'], `${onde}.localCamara`);
    return {
      id: inteiroPositivo(o['id'], `${onde}.id`),
      dataHoraInicio: inicio,
      descricaoTipo: texto(o['descricaoTipo'], `${onde}.descricaoTipo`, 200),
      situacao: textoOpcional(o['situacao'], `${onde}.situacao`, 100),
      local: local ? textoOpcional(local['nome'], `${onde}.localCamara.nome`, 300) : null,
    };
  });
}

/** Legislatura atual (API v2 /legislaturas, conferido em 2026-11-13). */
export const LEGISLATURA_ATUAL = { id: 57, inicio: '2023-02-01', fim: '2027-01-31' } as const;

// --- Histórico do mandato (entradas e saídas de exercício) -----------------------------

export interface EventoHistorico {
  /** Horário de Brasília, sem fuso (AAAA-MM-DDTHH:MM). */
  readonly dataHora: string;
  /** "Exercício", "Licença", "Suplência", "FIM_MANDATO"…; null em registro só de nome/partido. */
  readonly situacao: string | null;
  readonly descricaoStatus: string | null;
  readonly idLegislatura: number;
}

export function urlHistoricoDeputado(id: number): string {
  return `${CAMARA_API}/deputados/${inteiroPositivo(id, 'id')}/historico`;
}

export function lerHistorico(corpo: string): EventoHistorico[] {
  let json: unknown;
  try {
    json = JSON.parse(corpo);
  } catch {
    throw new ErroFormato('histórico não é JSON');
  }
  const dados = objeto(json, 'resposta')['dados'];
  if (!Array.isArray(dados)) throw new ErroFormato('resposta.dados: esperado lista');
  return dados.map((valor, i) => {
    const o = objeto(valor, `dados[${i}]`);
    const dataHora = texto(o['dataHora'], `dados[${i}].dataHora`, 19);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dataHora)) throw new ErroFormato(`dados[${i}].dataHora: formato inesperado`);
    return {
      dataHora: dataHora.slice(0, 16),
      situacao: textoOpcional(o['situacao'], `dados[${i}].situacao`, 50),
      descricaoStatus: textoOpcional(o['descricaoStatus'], `dados[${i}].descricaoStatus`, 300),
      idLegislatura: inteiroPositivo(o['idLegislatura'], `dados[${i}].idLegislatura`),
    };
  });
}
