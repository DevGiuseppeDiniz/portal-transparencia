import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ErroArquivo, lerCsv, lerZip } from './arquivos.ts';
import { zipDeUmaEntrada } from './zip-de-teste.ts';

test('lerZip: extrai entrada deflate e stored', () => {
  const texto = Buffer.from('a;b\n1;2\n'.repeat(1000));
  for (const metodo of [0, 8] as const) {
    const entradas = lerZip(zipDeUmaEntrada('Ano-2025.csv', texto, metodo));
    assert.deepEqual([...entradas.keys()], ['Ano-2025.csv']);
    assert.deepEqual(entradas.get('Ano-2025.csv')!(), texto);
  }
});

test('lerZip: recusa truncado, nome com ../ e tamanho que não confere', () => {
  const zip = zipDeUmaEntrada('a.csv', Buffer.from('x'));
  assert.throws(() => lerZip(zip.subarray(0, zip.length - 10)), ErroArquivo);
  assert.throws(() => lerZip(zipDeUmaEntrada('../a.csv', Buffer.from('x'))), /suspeito/);
  const mentiroso = Buffer.from(zip);
  // tamanho descompactado declarado no diretório central: 99 em vez de 1
  mentiroso.writeUInt32LE(99, mentiroso.length - 22 - 46 - 'a.csv'.length + 24);
  assert.throws(() => lerZip(mentiroso).get('a.csv')!(), /não confere/);
});

test('lerCsv: BOM, aspas, aspas escapadas, separador e quebra de linha dentro de aspas', () => {
  const csv = '﻿"id";"texto"\r\n"1";"a;b"\r\n2;"diz ""oi"""\n3;"linha1\nlinha2"\n';
  assert.deepEqual(lerCsv(csv), [
    { id: '1', texto: 'a;b' },
    { id: '2', texto: 'diz "oi"' },
    { id: '3', texto: 'linha1\nlinha2' },
  ]);
});

test('lerCsv: recusa linha com número de colunas diferente e aspas abertas', () => {
  assert.throws(() => lerCsv('a;b\n1;2;3\n'), /colunas/);
  assert.throws(() => lerCsv('a;b\n1;"2\n'), /aspas/);
});
