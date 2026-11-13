// Armazenamento do payload bruto (camada `raw`, DEC-10 / 11-arquitetura).
//
// Endereçado por conteúdo: <fonte>/<AAAA-MM-DD>/<sha256>.json.gz. O nome do arquivo é a
// prova de integridade (`hash_conteudo` da coleta) e um arquivo nunca é sobrescrito.
// Hoje grava em disco local; em produção a mesma interface ganha uma implementação S3.

import { createHash } from 'node:crypto';
import { link, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

export interface ObjetoRaw {
  /** Caminho relativo à raiz do armazenamento; vai para raw.coleta.caminho_raw. */
  readonly caminho: string;
  /** SHA-256 do conteúdo descomprimido, em hexadecimal; vai para raw.coleta.hash_conteudo. */
  readonly hash: string;
  readonly bytes: number;
}

export interface ArmazenamentoRaw {
  /** Pacote JSON da coleta (respostas de API), guardado comprimido. */
  salvar(fonteId: string, conteudo: string, em: Date): Promise<ObjetoRaw>;
  /**
   * Arquivo oficial (ex.: ZIP da CEAP) guardado byte a byte, sem recomprimir: o hash é o do
   * próprio arquivo, e qualquer pessoa pode baixá-lo da fonte e conferir.
   */
  salvarArquivo(fonteId: string, bytes: Buffer, extensao: 'zip', em: Date): Promise<ObjetoRaw>;
  /** Devolve o conteúdo e confere que o hash bate com o nome (adulteração = erro). */
  ler(caminho: string): Promise<string>;
  lerArquivo(caminho: string): Promise<Buffer>;
}

const CAMINHO_VALIDO = /^(SRC-[0-9]{2}[a-z]?)\/(\d{4}-\d{2}-\d{2})\/([0-9a-f]{64})\.(json\.gz|zip)$/;

export function sha256(conteudo: string | Buffer): string {
  return createHash('sha256').update(conteudo).digest('hex');
}

export function armazenamentoEmDisco(raiz: string): ArmazenamentoRaw {
  /** Grava sem nunca sobrescrever e sem deixar arquivo pela metade no caminho final. */
  async function gravar(fonteId: string, hash: string, extensao: string, dados: Buffer, em: Date): Promise<string> {
    const caminho = `${fonteId}/${em.toISOString().slice(0, 10)}/${hash}.${extensao}`;
    if (!CAMINHO_VALIDO.test(caminho)) throw new Error(`fonte inválida para o raw: ${fonteId}`);
    const destino = join(raiz, caminho);
    await mkdir(dirname(destino), { recursive: true });
    // Temporário + link(): link falha se o definitivo já existir.
    const temporario = `${destino}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporario, dados, { mode: 0o444 });
    try {
      await link(temporario, destino);
    } catch (e) {
      // Mesmo hash = mesmo conteúdo: já está guardado.
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
    } finally {
      await rm(temporario, { force: true });
    }
    return caminho;
  }

  async function lerConferido(caminho: string): Promise<Buffer> {
    const partes = CAMINHO_VALIDO.exec(caminho);
    if (!partes) throw new Error(`caminho raw inválido: ${caminho}`);
    const arquivo = await readFile(join(raiz, caminho));
    const conteudo = partes[4] === 'json.gz' ? gunzipSync(arquivo) : arquivo;
    if (sha256(conteudo) !== partes[3]) throw new Error(`raw adulterado: o hash de ${caminho} não confere`);
    return conteudo;
  }

  return {
    async salvar(fonteId, conteudo, em) {
      const hash = sha256(conteudo);
      const caminho = await gravar(fonteId, hash, 'json.gz', gzipSync(conteudo), em);
      return { caminho, hash, bytes: Buffer.byteLength(conteudo) };
    },
    async salvarArquivo(fonteId, bytes, extensao, em) {
      const hash = sha256(bytes);
      const caminho = await gravar(fonteId, hash, extensao, bytes, em);
      return { caminho, hash, bytes: bytes.length };
    },
    async ler(caminho) {
      if (!CAMINHO_VALIDO.test(caminho)) throw new Error(`caminho raw inválido: ${caminho}`);
      if (!caminho.endsWith('.json.gz')) throw new Error(`não é um pacote JSON: ${caminho}`);
      return (await lerConferido(caminho)).toString('utf8');
    },
    async lerArquivo(caminho) {
      return lerConferido(caminho);
    },
  };
}

/** Raiz padrão: <repo>/data/raw (ignorada pelo git). RAW_DIR sobrescreve. */
export function raizRawPadrao(): string {
  return process.env['RAW_DIR'] ?? join(import.meta.dirname, '..', '..', '..', 'data', 'raw');
}
