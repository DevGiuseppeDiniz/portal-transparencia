import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { lerMigrations } from './migrar.ts';

test('lerMigrations: as migrations do repositório estão em ordem e com hash', async () => {
  const migrations = await lerMigrations();
  const nomes = migrations.map((m) => m.nome);
  assert.deepEqual(nomes, [...nomes].sort());
  assert.ok(nomes.includes('0001_proveniencia.sql'));
  for (const m of migrations) assert.match(m.hash, /^[0-9a-f]{64}$/);
});

test('lerMigrations: recusa nome fora do padrão', async () => {
  const pasta = await mkdtemp(join(tmpdir(), 'migrations-'));
  try {
    await writeFile(join(pasta, 'sem-numero.sql'), 'select 1;');
    await assert.rejects(lerMigrations(pasta), /fora do padrão/);
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
});
