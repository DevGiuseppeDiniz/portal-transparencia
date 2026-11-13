// Barreira 3b — superfície de servidor do Next.js (DEC-12: static-first, só leitura).
//
// Mesmo um site "estático" em Next roda código no servidor (RSC, Server Actions, route
// handlers, middleware/proxy). Quanto menos superfície, menos uma falha do framework atinge.
// Uso: node scripts/ci/check-superficie-servidor.mjs <dir-do-app>
// Bloqueia:
//   - diretiva "use server" (Server Actions = endpoint de escrita via POST);
//   - route handlers que exportam POST/PUT/PATCH/DELETE;
//   - componente "use client" importando o pacote do banco (credencial no navegador);
//   - o app depender de @portal/db (o site lê só o snapshot publicado);
//   - next.config sem poweredByHeader: false.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { RAIZ, erro, aviso, info, finalizar, percorrer, rel } from './lib.mjs';

const app = process.argv[2];
if (!app) {
  console.error('uso: check-superficie-servidor.mjs <dir-do-app>');
  process.exit(2);
}
const base = join(RAIZ, app);
if (!existsSync(join(base, 'package.json'))) {
  info(`${app} ainda não existe: nada a verificar.`);
  finalizar('Superfície de servidor do Next.js');
  process.exit(0);
}

const DIRETIVA_SERVER = /^\s*['"]use server['"]\s*;?\s*$/m;
const DIRETIVA_CLIENT = /^\s*['"]use client['"]\s*;?\s*$/m;
const METODO_ESCRITA =
  /export\s+(async\s+)?function\s+(POST|PUT|PATCH|DELETE)\b|export\s+(const|let|var)\s+(POST|PUT|PATCH|DELETE)\b|export\s*\{[^}]*\b(POST|PUT|PATCH|DELETE)\b[^}]*\}/;
const IMPORT_BANCO = /from\s+['"](@portal\/db|[./]*packages\/db)[^'"]*['"]|require\(\s*['"]@portal\/db/;

// O site público lê só o snapshot publicado (data/publicado); não tem acesso ao banco.
const manifesto = JSON.parse(await readFile(join(base, 'package.json'), 'utf8'));
for (const campo of ['dependencies', 'devDependencies', 'peerDependencies']) {
  if (manifesto[campo]?.['@portal/db']) {
    erro(`${app}/package.json: depende de @portal/db. O site lê só o snapshot publicado, nunca o banco (DEC-12, SEG-01).`);
  }
}

let arquivos = 0;
for await (const arquivo of percorrer(base)) {
  if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(arquivo)) continue;
  arquivos++;
  const r = rel(arquivo);
  const texto = await readFile(arquivo, 'utf8');

  if (DIRETIVA_SERVER.test(texto)) {
    erro(`${r}: "use server" (Server Action) é proibido. A aplicação pública é somente leitura (DEC-12).`);
  }
  if (/^route\.(ts|js|mjs)$/.test(basename(arquivo))) {
    const m = texto.match(METODO_ESCRITA);
    if (m) erro(`${r}: route handler de escrita (${m[0].trim()}). Só GET é permitido (DEC-12).`);
  }
  if (DIRETIVA_CLIENT.test(texto) && IMPORT_BANCO.test(texto)) {
    erro(`${r}: componente cliente importa o pacote do banco. Credencial e query iriam para o navegador.`);
  }
  if (/^(middleware|proxy)\.(ts|js)$/.test(basename(arquivo))) {
    aviso(`${r}: middleware/proxy existe. Nunca use-o como única barreira de autorização.`);
  }
}

const configs = ['next.config.ts', 'next.config.mjs', 'next.config.js'].map((f) => join(base, f)).filter(existsSync);
if (configs.length === 0) {
  erro(`${app}: next.config não encontrado.`);
} else {
  const cfg = await readFile(configs[0], 'utf8');
  if (!/poweredByHeader\s*:\s*false/.test(cfg)) {
    erro(`${rel(configs[0])}: defina poweredByHeader: false (não anunciar o framework/versão).`);
  }
}

info(`${arquivos} arquivo(s) de ${app} verificado(s).`);
finalizar('Superfície de servidor do Next.js');
