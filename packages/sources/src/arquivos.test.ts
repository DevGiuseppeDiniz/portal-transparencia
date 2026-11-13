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

test('linhasCsv: com aoLinhaInvalida, pula e informa a linha truncada', async () => {
  const { linhasCsv } = await import('./arquivos.ts');
  const invalidas: number[] = [];
  const linhas = [...linhasCsv('a;b\n1;2\n3\n4;5\n', ';', { aoLinhaInvalida: (n) => invalidas.push(n) })];
  assert.deepEqual(linhas, [{ a: '1', b: '2' }, { a: '4', b: '5' }]);
  assert.deepEqual(invalidas, [3]);
});

test('linhasCsv: registro truncado com aspas abertas não engole o resto do arquivo', async () => {
  const { linhasCsv } = await import('./arquivos.ts');
  const invalidas: number[] = [];
  // "x; y" no meio do texto de várias linhas não pode ser confundido com um registro novo.
  const csv = '"a";"b"\n"1";"2"\n"3";"trunc\n"4";"5"\n"6";"multi\nx; y\nlinha"\n"7";"8"\n';
  const linhas = [...linhasCsv(csv, ';', { aoLinhaInvalida: (n) => invalidas.push(n) })];
  assert.deepEqual(linhas, [{ a: '1', b: '2' }, { a: '4', b: '5' }, { a: '6', b: 'multi\nx; y\nlinha' }, { a: '7', b: '8' }]);
  assert.deepEqual(invalidas, [3]);
});

test('separarPalavrasChave: separa, limpa, mantém nomes e siglas', async () => {
  const { separarPalavrasChave } = await import('./proposicoes.ts');
  assert.deepEqual(
    separarPalavrasChave('Alteração, Estatuto do Desarmamento, Sistema Nacional de Armas (Sinarm), aumento, pena de reclusão, disparo, arma de fogo de uso restrito.'),
    ['Estatuto do Desarmamento', 'Sistema Nacional de Armas (Sinarm)', 'aumento', 'pena de reclusão', 'disparo', 'arma de fogo de uso restrito'],
  );
  assert.deepEqual(separarPalavrasChave(''), []);
  assert.deepEqual(separarPalavrasChave('Lei nº 8.069, de 1990, ECA, ECA.'), ['Lei nº 8.069', 'de 1990', 'ECA']);
});
