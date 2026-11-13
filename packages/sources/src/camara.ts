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
