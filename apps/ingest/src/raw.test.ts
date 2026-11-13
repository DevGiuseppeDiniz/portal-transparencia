import assert from 'node:assert/strict';
import { chmod, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { gzipSync } from 'node:zlib';
import { armazenamentoEmDisco, sha256 } from './raw.ts';

const raiz = await mkdtemp(join(tmpdir(), 'raw-'));
after(() => rm(raiz, { recursive: true, force: true }));
const raw = armazenamentoEmDisco(raiz);
const em = new Date('2026-11-13T12:00:00Z');

test('salvar/ler: caminho endereçado pelo SHA-256 e ida e volta sem perda', async () => {
  const conteudo = '{"nome":"Acácio"}';
  const o = await raw.salvar('SRC-01', conteudo, em);
  assert.equal(o.hash, sha256(conteudo));
  assert.equal(o.caminho, `SRC-01/2026-11-13/${o.hash}.json.gz`);
  assert.equal(o.bytes, Buffer.byteLength(conteudo));
  assert.equal(await raw.ler(o.caminho), conteudo);
});

test('salvar: mesmo conteúdo duas vezes não duplica nem deixa temporário', async () => {
  const a = await raw.salvar('SRC-01', 'repetido', em);
  const b = await raw.salvar('SRC-01', 'repetido', em);
  assert.equal(a.caminho, b.caminho);
  const arquivos = await readdir(join(raiz, 'SRC-01', '2026-11-13'));
  assert.ok(arquivos.every((a) => a.endsWith('.json.gz')));
});

test('ler: detecta arquivo adulterado', async () => {
  const o = await raw.salvar('SRC-01', 'original', em);
  const arquivo = join(raiz, o.caminho);
  await chmod(arquivo, 0o644);
  await writeFile(arquivo, gzipSync('adulterado'));
  await assert.rejects(raw.ler(o.caminho), /adulterado/);
});

test('ler/salvar: recusam caminho e fonte fora do padrão (path traversal)', async () => {
  await assert.rejects(raw.ler('../../etc/passwd'), /inválido/);
  await assert.rejects(raw.salvar('../fora', 'x', em), /inválida/);
});

test('salvarArquivo: guarda os bytes exatos, com o hash do próprio arquivo', async () => {
  const bytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 1, 2, 255]);
  const o = await raw.salvarArquivo('SRC-01c', bytes, 'zip', em);
  assert.equal(o.hash, sha256(bytes));
  assert.equal(o.caminho, `SRC-01c/2026-11-13/${o.hash}.zip`);
  assert.deepEqual(await raw.lerArquivo(o.caminho), bytes);
  await assert.rejects(raw.ler(o.caminho), /não é um pacote JSON/);
});

test('salvarArquivo csv: comprime no disco, mas o hash e a leitura são do original', async () => {
  const bytes = Buffer.from('"id";"x"\n"1";"2"\n');
  const o = await raw.salvarArquivo('SRC-01b', bytes, 'csv', em);
  assert.equal(o.hash, sha256(bytes));
  assert.match(o.caminho, /\.csv\.gz$/);
  assert.deepEqual(await raw.lerArquivo(o.caminho), bytes);
});
