// Conexão com o PostgreSQL (driver `postgres`, aprovado em security/dependencias-aprovadas.json).
// Só código de servidor importa isto: apps/ingest e scripts. Componente cliente que importe
// @portal/db é bloqueado pela barreira 3b (docs/14-barreiras-ci.md).

import postgres from 'postgres';

export type Sql = postgres.Sql;
export type TransacaoSql = postgres.TransactionSql;

/** Abre um pool. A URL vem de DATABASE_URL (security/env-servidor.json), nunca do código. */
export function conectar(url: string | undefined = process.env['DATABASE_URL'], nomeAplicacao = 'portal'): Sql {
  if (!url) {
    throw new Error('DATABASE_URL não definida. Localmente: `pnpm db:up` cria o .env (docs/11-arquitetura.md#ambiente-local).');
  }
  return postgres(url, {
    max: 5,
    // Avisos do servidor (ex.: "schema já existe") não interessam no log.
    onnotice: () => {},
    connection: { application_name: nomeAplicacao },
  });
}
