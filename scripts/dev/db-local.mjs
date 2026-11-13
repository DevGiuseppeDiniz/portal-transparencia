// PostgreSQL local para desenvolvimento, via `docker run` (sem docker compose).
//
//   pnpm db:up      cria o .env (senha aleatória) se faltar e sobe o container
//   pnpm db:down    para o container (os dados ficam no volume)
//   node scripts/dev/db-local.mjs reset --sim   APAGA container e volume
//
// Segurança: a porta só escuta em 127.0.0.1; a senha nunca entra no repositório nem na
// linha de comando (vai pelo ambiente do processo filho); o .env é ignorado pelo git.

import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(import.meta.dirname, '..', '..');
const ENV = join(RAIZ, '.env');
const CONTAINER = 'portal-parlamentar-pg';
const VOLUME = 'portal-parlamentar-pg';
const PORTA = '54329';
// Fixada por digest (tag é mutável). Conferida no Docker Hub em 2026-11-13.
const IMAGEM = 'postgres:18.7-alpine@sha256:75dcac3dfb1cd01ca3536910bbc84128759362f8b118bf8c55b38a94f68f3b73';

function docker(args, opcoes = {}) {
  return spawnSync('docker', args, { encoding: 'utf8', ...opcoes });
}

function estado() {
  const r = docker(['inspect', '-f', '{{.State.Running}}', CONTAINER]);
  if (r.status !== 0) return 'inexistente';
  return r.stdout.trim() === 'true' ? 'rodando' : 'parado';
}

function lerOuCriarEnv() {
  let texto = existsSync(ENV) ? readFileSync(ENV, 'utf8') : '';
  let senha = /^POSTGRES_PASSWORD_LOCAL=(.+)$/m.exec(texto)?.[1];
  if (!senha) {
    senha = randomBytes(24).toString('hex');
    texto +=
      `${texto && !texto.endsWith('\n') ? '\n' : ''}` +
      `# Gerado por scripts/dev/db-local.mjs. Só desenvolvimento local; nunca versionar.\n` +
      `POSTGRES_PASSWORD_LOCAL=${senha}\n`;
  }
  if (!/^DATABASE_URL=/m.test(texto)) {
    texto += `DATABASE_URL=postgres://portal:${senha}@127.0.0.1:${PORTA}/portal\n`;
  }
  writeFileSync(ENV, texto, { mode: 0o600 });
  return senha;
}

function esperarPronto() {
  for (let i = 0; i < 60; i++) {
    if (docker(['exec', CONTAINER, 'pg_isready', '-U', 'portal', '-d', 'portal', '-q']).status === 0) return;
    execFileSync('sleep', ['1']);
  }
  throw new Error('PostgreSQL não ficou pronto em 60 s. Veja: docker logs ' + CONTAINER);
}

const comando = process.argv[2];

if (comando === 'up') {
  const senha = lerOuCriarEnv();
  const atual = estado();
  if (atual === 'inexistente') {
    const r = docker(
      [
        'run', '-d', '--name', CONTAINER,
        '-e', 'POSTGRES_USER=portal', '-e', 'POSTGRES_DB=portal', '-e', 'POSTGRES_PASSWORD',
        '-p', `127.0.0.1:${PORTA}:5432`,
        '-v', `${VOLUME}:/var/lib/postgresql`,
        IMAGEM,
      ],
      { env: { ...process.env, POSTGRES_PASSWORD: senha }, stdio: ['ignore', 'pipe', 'inherit'] },
    );
    if (r.status !== 0) process.exit(r.status ?? 1);
  } else if (atual === 'parado') {
    docker(['start', CONTAINER], { stdio: 'inherit' });
  }
  esperarPronto();
  console.log(`PostgreSQL local pronto em 127.0.0.1:${PORTA} (DATABASE_URL no .env). Próximo: pnpm db:migrar`);
} else if (comando === 'down') {
  if (estado() === 'rodando') docker(['stop', CONTAINER], { stdio: 'inherit' });
  console.log('container parado; os dados continuam no volume ' + VOLUME);
} else if (comando === 'reset') {
  if (process.argv[3] !== '--sim') {
    console.error('reset APAGA o banco local. Para confirmar: node scripts/dev/db-local.mjs reset --sim');
    process.exit(1);
  }
  docker(['rm', '-f', CONTAINER], { stdio: 'inherit' });
  docker(['volume', 'rm', VOLUME], { stdio: 'inherit' });
  console.log('banco local apagado. O .env foi mantido.');
} else {
  console.error('uso: node scripts/dev/db-local.mjs up | down | reset --sim');
  process.exit(1);
}
