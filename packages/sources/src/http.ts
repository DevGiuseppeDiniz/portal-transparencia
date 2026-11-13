// Cliente HTTP dos coletores: timeout, retry com backoff e respeito ao Retry-After.
// Devolve o corpo como texto, exatamente como veio: quem grava o `raw` precisa dos bytes
// originais (DEC-10), e a interpretação acontece depois.

export interface RespostaBruta {
  readonly url: string;
  readonly status: number;
  /** ISO 8601, UTC. */
  readonly recebidaEm: string;
  readonly cabecalhos: Readonly<Record<string, string>>;
  readonly corpo: string;
}

export interface RespostaBinaria extends Omit<RespostaBruta, 'corpo'> {
  readonly bytes: Buffer;
}

export interface OpcoesHttp {
  readonly fetch?: typeof fetch;
  /** Tentativas no total (1 = sem retry). */
  readonly tentativas?: number;
  readonly timeoutMs?: number;
  /** Injetável nos testes. */
  readonly esperar?: (ms: number) => Promise<void>;
  readonly aoTentarDeNovo?: (info: { url: string; tentativa: number; motivo: string; esperaMs: number }) => void;
}

export class ErroHttp extends Error {
  readonly url: string;
  readonly status: number | null;
  constructor(mensagem: string, url: string, status: number | null) {
    super(mensagem);
    this.name = 'ErroHttp';
    this.url = url;
    this.status = status;
  }
}

// Identificação genérica: não leva nome nem contato de pessoa.
const USER_AGENT = 'portal-parlamentar-coletor/0.1 (+dados abertos; somente leitura)';
const ESPERA_MAXIMA_MS = 60_000;
const CABECALHOS_GUARDADOS = ['content-type', 'content-length', 'x-total-count', 'link', 'last-modified', 'etag', 'date'];

const esperarPadrao = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

function deveTentarDeNovo(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Retry-After em segundos ou data HTTP. */
export function lerRetryAfter(valor: string | null, agora = Date.now()): number | null {
  if (!valor) return null;
  const segundos = Number(valor);
  if (Number.isFinite(segundos) && segundos >= 0) return segundos * 1000;
  const data = Date.parse(valor);
  return Number.isNaN(data) ? null : Math.max(0, data - agora);
}

export async function obter(url: string, opcoes: OpcoesHttp = {}): Promise<RespostaBruta> {
  const { bytes, ...resto } = await requisitar(url, opcoes, 'application/json');
  return { ...resto, corpo: bytes.toString('utf8') };
}

/** Para arquivos (ZIP etc.): devolve os bytes exatos, sem decodificar. */
export async function obterBytes(url: string, opcoes: OpcoesHttp = {}): Promise<RespostaBinaria> {
  return requisitar(url, { timeoutMs: 300_000, ...opcoes }, '*/*');
}

async function requisitar(url: string, opcoes: OpcoesHttp, accept: string): Promise<RespostaBinaria> {
  const {
    fetch: buscar = fetch,
    tentativas = 4,
    timeoutMs = 30_000,
    esperar = esperarPadrao,
    aoTentarDeNovo,
  } = opcoes;

  let ultimoErro: ErroHttp | null = null;
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    let esperaMs = 1000 * 2 ** (tentativa - 1);
    let resposta: Response | null = null;
    let bytes = Buffer.alloc(0);
    try {
      resposta = await buscar(url, {
        headers: { accept, 'user-agent': USER_AGENT },
        redirect: 'error',
        signal: AbortSignal.timeout(timeoutMs),
      });
      bytes = Buffer.from(await resposta.arrayBuffer());
    } catch (e) {
      const motivo = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      ultimoErro = new ErroHttp(`falha de rede em ${url} (${motivo})`, url, null);
      resposta = null;
    }

    if (resposta?.ok) {
      const cabecalhos: Record<string, string> = {};
      for (const nome of CABECALHOS_GUARDADOS) {
        const valor = resposta.headers.get(nome);
        if (valor !== null) cabecalhos[nome] = valor;
      }
      return { url, status: resposta.status, recebidaEm: new Date().toISOString(), cabecalhos, bytes };
    }
    if (resposta) {
      ultimoErro = new ErroHttp(`HTTP ${resposta.status} em ${url}`, url, resposta.status);
      if (!deveTentarDeNovo(resposta.status)) throw ultimoErro;
      esperaMs = lerRetryAfter(resposta.headers.get('retry-after')) ?? esperaMs;
    }
    if (tentativa < tentativas) {
      esperaMs = Math.min(esperaMs, ESPERA_MAXIMA_MS);
      aoTentarDeNovo?.({ url, tentativa, motivo: ultimoErro?.message ?? '?', esperaMs });
      await esperar(esperaMs);
    }
  }
  throw ultimoErro ?? new ErroHttp(`falha em ${url}`, url, null);
}
