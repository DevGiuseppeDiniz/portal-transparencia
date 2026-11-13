// Runner de migrations, sem dependência extra (10-pendencias).
//
// Aplica packages/db/migrations/NNNN_nome.sql em ordem, cada uma numa transação, e registra
// em public.schema_migrations com o SHA-256 do arquivo. Migration já aplicada não pode ser
// editada: se o hash mudou, o runner para (crie uma nova migration em vez de editar).
//
// Uso: pnpm db:migrar

import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { conectar, type Sql } from './conexao.ts';

const PASTA = join(import.meta.dirname, '..', 'migrations');
const NOME_VALIDO = /^\d{4}_[a-z0-9_]+\.sql$/;
// Chave arbitrária e fixa: impede duas execuções simultâneas do runner.
const TRAVA = 4_242_001;

export interface Migration {
  readonly nome: string;
  readonly hash: string;
  readonly sql: string;
}

export async function lerMigrations(pasta = PASTA): Promise<Migration[]> {
  const arquivos = (await readdir(pasta)).filter((a) => a.endsWith('.sql')).sort();
  const migrations: Migration[] = [];
  for (const nome of arquivos) {
    if (!NOME_VALIDO.test(nome)) throw new Error(`migration com nome fora do padrão NNNN_nome.sql: ${nome}`);
    const sql = await readFile(join(pasta, nome), 'utf8');
    migrations.push({ nome, sql, hash: createHash('sha256').update(sql).digest('hex') });
  }
  return migrations;
}

export async function migrar(sql: Sql, migrations: readonly Migration[]): Promise<string[]> {
  const aplicadasAgora: string[] = [];
  await sql`select pg_advisory_lock(${TRAVA})`;
  try {
    await sql`
      create table if not exists public.schema_migrations (
        nome       text primary key,
        hash       text not null,
        aplicada_em timestamptz not null default now()
      )`;
    const linhas = await sql<{ nome: string; hash: string }[]>`select nome, hash from public.schema_migrations`;
    const aplicadas = new Map(linhas.map((l) => [l.nome, l.hash]));

    for (const m of migrations) {
      const hashAplicado = aplicadas.get(m.nome);
      if (hashAplicado !== undefined) {
        if (hashAplicado !== m.hash) {
          throw new Error(`${m.nome} foi editada depois de aplicada (hash diferente). Crie uma nova migration.`);
        }
        continue;
      }
      await sql.begin(async (tx) => {
        await tx.unsafe(m.sql).simple();
        await tx`insert into public.schema_migrations (nome, hash) values (${m.nome}, ${m.hash})`;
      });
      aplicadasAgora.push(m.nome);
    }
  } finally {
    await sql`select pg_advisory_unlock(${TRAVA})`;
  }
  return aplicadasAgora;
}

if (import.meta.main) {
  const sql = conectar(undefined, 'portal-migrar');
  try {
    const aplicadas = await migrar(sql, await lerMigrations());
    console.log(aplicadas.length ? `migrations aplicadas: ${aplicadas.join(', ')}` : 'banco já está atualizado');
  } finally {
    await sql.end();
  }
}
