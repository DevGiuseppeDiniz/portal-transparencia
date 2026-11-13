// Barreira 3a — vulnerabilidade conhecida no framework (Next.js / React / RSC).
//
// Lê as versões RESOLVIDAS no pnpm-lock.yaml e consulta o OSV (api.osv.dev), que agrega
// GitHub Advisory e outros. Tolerância zero: qualquer vulnerabilidade conhecida, de
// qualquer severidade, nos pacotes do framework bloqueia. Não há lista de exceções:
// a correção é atualizar. Para patch urgente, ver docs/14-barreiras-ci.md#patch-urgente.
//
// Roda também no agendamento diário: uma versão aprovada ontem pode ganhar CVE hoje.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, erro, info, finalizar, buscar } from './lib.mjs';

const ehFramework = (nome) =>
  nome === 'next' ||
  nome.startsWith('@next/') ||
  nome === 'react' ||
  nome === 'react-dom' ||
  nome.startsWith('react-server-dom-');

const lock = join(RAIZ, 'pnpm-lock.yaml');
if (!existsSync(lock)) {
  info('Sem pnpm-lock.yaml: nenhum framework instalado.');
  finalizar('Vulnerabilidades do framework');
  process.exit(0);
}

const texto = await readFile(lock, 'utf8');
const pares = new Map();
// Chaves de packages/snapshots no lockfile v9: "  next@16.0.0:" ou "  '@next/env@16.0.0':"
for (const m of texto.matchAll(/^ {2}'?((?:@[^/@\s']+\/)?[^@\s'/]+)@(\d[^('":\s]*)/gm)) {
  const [, nome, versao] = m;
  if (ehFramework(nome)) pares.set(`${nome}@${versao}`, { nome, versao });
}

if (pares.size === 0) {
  info('Nenhum pacote do framework no lockfile.');
  finalizar('Vulnerabilidades do framework');
  process.exit(0);
}

const lista = [...pares.values()];
const resp = await buscar('https://api.osv.dev/v1/querybatch', {
  metodo: 'POST',
  corpo: { queries: lista.map(({ nome, versao }) => ({ package: { name: nome, ecosystem: 'npm' }, version: versao })) },
});

if (resp.status !== 200 || !Array.isArray(resp.json?.results)) {
  erro(`Falha ao consultar o OSV (${resp.status ?? resp.erro}). Falha fechada: sem consulta, sem deploy.`);
} else {
  for (const [i, resultado] of resp.json.results.entries()) {
    const { nome, versao } = lista[i];
    const vulns = resultado.vulns ?? [];
    if (vulns.length === 0) {
      info(`  · ${nome}@${versao}: sem vulnerabilidade conhecida`);
      continue;
    }
    for (const { id } of vulns) {
      const det = await buscar(`https://api.osv.dev/v1/vulns/${id}`);
      const resumo = det.json?.summary ?? '(sem resumo)';
      const aliases = (det.json?.aliases ?? []).join(', ');
      erro(`${nome}@${versao}: ${id}${aliases ? ` (${aliases})` : ''} — ${resumo}`);
    }
  }
}

finalizar('Vulnerabilidades do framework');
