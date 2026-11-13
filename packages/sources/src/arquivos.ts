// Leitura de ZIP e CSV sem dependência (regra 2 do CLAUDE.md), para os arquivos anuais da
// CEAP (SRC-01c). Só o necessário: ZIP com entradas "stored" ou "deflate" (sem criptografia,
// sem ZIP64) e CSV com separador configurável e aspas no padrão RFC 4180.

import { inflateRawSync } from 'node:zlib';

export class ErroArquivo extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroArquivo';
  }
}

export interface EntradaZip {
  readonly nome: string;
  readonly tamanho: number;
}

/** Limite contra "zip bomb": nenhuma entrada descompactada passa disso. */
const MAX_DESCOMPACTADO = 1024 * 1024 * 1024;

function localizarFimDoDiretorio(zip: Buffer): number {
  // EOCD: assinatura 0x06054b50, nos últimos 22 + 65535 bytes (comentário opcional).
  const minimo = Math.max(0, zip.length - 22 - 0xffff);
  for (let i = zip.length - 22; i >= minimo; i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new ErroArquivo('ZIP sem diretório central (arquivo truncado?)');
}

/** Lista e extrai as entradas de um ZIP já em memória. */
export function lerZip(zip: Buffer): Map<string, () => Buffer> {
  const eocd = localizarFimDoDiretorio(zip);
  const total = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  const entradas = new Map<string, () => Buffer>();

  for (let n = 0; n < total; n++) {
    if (p + 46 > zip.length || zip.readUInt32LE(p) !== 0x02014b50) throw new ErroArquivo('diretório central corrompido');
    const flags = zip.readUInt16LE(p + 8);
    const metodo = zip.readUInt16LE(p + 10);
    const compactado = zip.readUInt32LE(p + 20);
    const tamanho = zip.readUInt32LE(p + 24);
    const lenNome = zip.readUInt16LE(p + 28);
    const lenExtra = zip.readUInt16LE(p + 30);
    const lenComentario = zip.readUInt16LE(p + 32);
    const local = zip.readUInt32LE(p + 42);
    const nome = zip.subarray(p + 46, p + 46 + lenNome).toString(flags & 0x800 ? 'utf8' : 'latin1');
    p += 46 + lenNome + lenExtra + lenComentario;

    if (flags & 0x1) throw new ErroArquivo(`${nome}: entrada criptografada`);
    if (compactado === 0xffffffff || tamanho === 0xffffffff) throw new ErroArquivo(`${nome}: ZIP64 não suportado`);
    if (tamanho > MAX_DESCOMPACTADO) throw new ErroArquivo(`${nome}: grande demais (${tamanho} bytes)`);
    if (nome.includes('..') || nome.startsWith('/')) throw new ErroArquivo(`nome de entrada suspeito: ${nome}`);

    entradas.set(nome, () => {
      if (zip.readUInt32LE(local) !== 0x04034b50) throw new ErroArquivo(`${nome}: cabeçalho local inválido`);
      const inicio = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const dados = zip.subarray(inicio, inicio + compactado);
      let saida: Buffer;
      if (metodo === 0) saida = Buffer.from(dados);
      else if (metodo === 8) saida = inflateRawSync(dados, { maxOutputLength: MAX_DESCOMPACTADO });
      else throw new ErroArquivo(`${nome}: método de compressão ${metodo} não suportado`);
      if (saida.length !== tamanho) throw new ErroArquivo(`${nome}: tamanho descompactado não confere`);
      return saida;
    });
  }
  return entradas;
}

/** Divide uma linha lógica em campos (aspas RFC 4180: "" é aspas literal). */
function campos(linha: string, separador: string): string[] {
  if (!linha.includes('"')) return linha.split(separador);
  const saida: string[] = [];
  let i = 0;
  while (i <= linha.length) {
    if (linha[i] === '"') {
      let valor = '';
      let j = i + 1;
      for (;;) {
        const fim = linha.indexOf('"', j);
        if (fim < 0) throw new ErroArquivo('CSV com aspas sem fechamento');
        valor += linha.slice(j, fim);
        if (linha[fim + 1] === '"') {
          valor += '"';
          j = fim + 2;
        } else {
          j = fim + 1;
          break;
        }
      }
      if (j < linha.length && linha[j] !== separador) throw new ErroArquivo('CSV: texto depois de campo entre aspas');
      saida.push(valor);
      i = j + 1;
    } else {
      const fim = linha.indexOf(separador, i);
      saida.push(linha.slice(i, fim < 0 ? linha.length : fim));
      i = fim < 0 ? linha.length + 1 : fim + 1;
    }
  }
  return saida;
}

/** A linha é, sozinha, um registro com `colunas` campos, todos entre aspas. */
function registroTodoEntreAspas(linha: string, separador: string, colunas: number): boolean {
  if (!linha.startsWith('"') || !linha.endsWith('"')) return false;
  let i = 0;
  let n = 0;
  while (i < linha.length) {
    if (linha[i] !== '"') return false;
    let j = i + 1;
    for (;;) {
      const fim = linha.indexOf('"', j);
      if (fim < 0) return false;
      if (linha[fim + 1] === '"') {
        j = fim + 2;
        continue;
      }
      j = fim + 1;
      break;
    }
    n++;
    if (j === linha.length) break;
    if (linha[j] !== separador) return false;
    i = j + 1;
  }
  return n === colunas;
}

/** Aspas abertas no fim da linha = o campo continua na próxima linha física. */
function aspasAbertas(linha: string): boolean {
  let n = 0;
  for (let i = linha.indexOf('"'); i >= 0; i = linha.indexOf('"', i + 1)) n++;
  return n % 2 === 1;
}

/**
 * CSV → objetos (cabeçalho na primeira linha), um por vez, sem montar o arquivo inteiro em
 * memória de novo. Linha com número de colunas diferente do cabeçalho é erro.
 */
export interface OpcoesCsv {
  /**
   * Linha com número de colunas diferente do cabeçalho: sem este callback é erro; com ele, a
   * linha é pulada e informada (os arquivos em massa da Câmara trazem ~1 registro truncado
   * por arquivo; quem chama decide o limite aceitável e registra na coleta).
   */
  readonly aoLinhaInvalida?: (numero: number, motivo: string) => void;
}

export function* linhasCsv(texto: string, separador = ';', opcoes: OpcoesCsv = {}): Generator<Record<string, string>> {
  let cabecalho: string[] | null = null;
  let pendente = '';
  let inicioPendente = 0;
  let numero = 0;
  let inicio = texto.charCodeAt(0) === 0xfeff ? 1 : 0;
  while (inicio < texto.length) {
    let fim = texto.indexOf('\n', inicio);
    if (fim < 0) fim = texto.length;
    let fisica = texto.slice(inicio, fim);
    if (fisica.endsWith('\r')) fisica = fisica.slice(0, -1);
    inicio = fim + 1;
    numero++;

    // Registro truncado com aspas abertas: sem isto, o "campo" engoliria o resto do arquivo.
    // Se a nova linha física sozinha já é um registro completo com TODOS os campos entre
    // aspas (formato dos arquivos da Câmara), o pendente era lixo. Exigir aspas em todos os
    // campos evita confundir com a continuação de um texto que tenha ";" no meio.
    if (pendente && cabecalho && opcoes.aoLinhaInvalida && registroTodoEntreAspas(fisica, separador, cabecalho.length)) {
      opcoes.aoLinhaInvalida(inicioPendente, 'registro truncado (aspas sem fechamento)');
      pendente = '';
    }

    const logica = pendente ? `${pendente}\n${fisica}` : fisica;
    if (aspasAbertas(logica)) {
      if (!pendente) inicioPendente = numero;
      pendente = logica;
      continue;
    }
    pendente = '';
    if (logica === '') continue;

    let valores: string[];
    try {
      valores = campos(logica, separador);
    } catch (e) {
      if (!cabecalho || !opcoes.aoLinhaInvalida) throw e;
      opcoes.aoLinhaInvalida(numero, e instanceof Error ? e.message : String(e));
      continue;
    }
    if (!cabecalho) {
      cabecalho = valores;
      continue;
    }
    if (valores.length !== cabecalho.length) {
      const motivo = `${valores.length} colunas, cabeçalho tem ${cabecalho.length}`;
      if (!opcoes.aoLinhaInvalida) throw new ErroArquivo(`linha ${numero}: ${motivo}`);
      opcoes.aoLinhaInvalida(numero, motivo);
      continue;
    }
    const o: Record<string, string> = {};
    for (let k = 0; k < cabecalho.length; k++) o[cabecalho[k]!] = valores[k]!;
    yield o;
  }
  if (pendente) {
    if (!cabecalho || !opcoes.aoLinhaInvalida) throw new ErroArquivo('CSV com aspas sem fechamento');
    opcoes.aoLinhaInvalida(inicioPendente, 'registro truncado no fim do arquivo (aspas sem fechamento)');
  }
}

export function lerCsv(texto: string, separador = ';'): Record<string, string>[] {
  return [...linhasCsv(texto, separador)];
}
