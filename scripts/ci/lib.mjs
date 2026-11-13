// Utilitários compartilhados pelas barreiras de CI.
// Regra: estes scripts NÃO têm dependências externas (só Node), para que a própria
// barreira de dependências não dependa de pacote instalado.

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

export const RAIZ = process.cwd();

export const PASTAS_IGNORADAS = new Set([
  'node_modules', '.git', '.next', 'out', 'dist', 'build', 'coverage', '.turbo', '.vercel',
]);

const erros = [];

export function erro(msg) {
  erros.push(msg);
}

export function aviso(msg) {
  console.log(`::warning::${msg}`);
}

export function info(msg) {
  console.log(msg);
}

export function finalizar(nome) {
  if (erros.length > 0) {
    for (const e of erros) console.log(`::error::${e}`);
    console.log(`\n✖ ${nome}: ${erros.length} problema(s). BLOQUEADO.`);
    process.exit(1);
  }
  console.log(`✔ ${nome}: ok`);
}

export function rel(caminho) {
  return relative(RAIZ, caminho) || '.';
}

export async function lerJson(caminho) {
  return JSON.parse(await readFile(caminho, 'utf8'));
}

export async function* percorrer(dir, { ignorar = PASTAS_IGNORADAS } = {}) {
  if (!existsSync(dir)) return;
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    if (ignorar.has(entrada.name)) continue;
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) yield* percorrer(caminho, { ignorar });
    else if (entrada.isFile()) yield caminho;
  }
}

/** package.json da raiz + apps/* + packages/* */
export async function manifestos() {
  const caminhos = [join(RAIZ, 'package.json')];
  for (const grupo of ['apps', 'packages']) {
    const dir = join(RAIZ, grupo);
    if (!existsSync(dir)) continue;
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name, 'package.json');
      if (e.isDirectory() && existsSync(p)) caminhos.push(p);
    }
  }
  const lidos = [];
  for (const caminho of caminhos) {
    if (existsSync(caminho)) lidos.push({ caminho, json: await lerJson(caminho) });
  }
  return lidos;
}

/** fetch com timeout e retry. Falha fechada: quem chama trata status null como erro. */
export async function buscar(url, { metodo = 'GET', corpo, tentativas = 3, timeoutMs = 60_000 } = {}) {
  let ultimoErro;
  for (let i = 1; i <= tentativas; i++) {
    try {
      const resp = await fetch(url, {
        method: metodo,
        headers: corpo ? { 'content-type': 'application/json' } : undefined,
        body: corpo ? JSON.stringify(corpo) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (resp.status >= 500 && i < tentativas) {
        ultimoErro = `HTTP ${resp.status}`;
      } else {
        const texto = await resp.text();
        let json = null;
        try { json = JSON.parse(texto); } catch { /* corpo não JSON */ }
        return { status: resp.status, json };
      }
    } catch (e) {
      ultimoErro = e.message;
    }
    await new Promise((r) => setTimeout(r, 1000 * i));
  }
  return { status: null, json: null, erro: ultimoErro };
}
