// Só para testes: monta um ZIP mínimo de uma entrada.

import { deflateRawSync } from 'node:zlib';

/** Monta um ZIP mínimo de uma entrada (deflate ou stored), no formato real do PKWARE. */
export function zipDeUmaEntrada(nome: string, conteudo: Buffer, metodo: 0 | 8 = 8): Buffer {
  const dados = metodo === 8 ? deflateRawSync(conteudo) : conteudo;
  const nomeBuf = Buffer.from(nome, 'utf8');
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x800, 6);
  local.writeUInt16LE(metodo, 8);
  local.writeUInt32LE(dados.length, 18);
  local.writeUInt32LE(conteudo.length, 22);
  local.writeUInt16LE(nomeBuf.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x800, 8);
  central.writeUInt16LE(metodo, 10);
  central.writeUInt32LE(dados.length, 20);
  central.writeUInt32LE(conteudo.length, 24);
  central.writeUInt16LE(nomeBuf.length, 28);
  central.writeUInt32LE(0, 42);
  const inicioCentral = local.length + nomeBuf.length + dados.length;
  const tamanhoCentral = central.length + nomeBuf.length;
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(1, 8);
  fim.writeUInt16LE(1, 10);
  fim.writeUInt32LE(tamanhoCentral, 12);
  fim.writeUInt32LE(inicioCentral, 16);
  return Buffer.concat([local, nomeBuf, dados, central, nomeBuf, fim]);
}
