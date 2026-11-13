// Barreira 1b — integridade do lockfile e do registro.
//
// - Existe dependência externa => pnpm-lock.yaml é obrigatório (install com --frozen-lockfile).
// - Toda resolução vem do registro oficial, com hash de integridade.
// - Proibido: tarball de outro host, git, commit.
// - .npmrc só pode apontar para https://registry.npmjs.org/.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, erro, info, finalizar, manifestos } from './lib.mjs';

const REGISTRO = 'https://registry.npmjs.org/';
const CAMPOS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

const projetos = await manifestos();
const temExternas = projetos.some(({ json }) =>
  CAMPOS.some((c) => Object.values(json[c] ?? {}).some((spec) => !String(spec).startsWith('workspace:'))),
);

const lock = join(RAIZ, 'pnpm-lock.yaml');
if (!existsSync(lock)) {
  if (temExternas) erro('Há dependências externas mas não há pnpm-lock.yaml commitado.');
  else info('Sem dependências externas e sem lockfile: nada a verificar.');
} else {
  const texto = await readFile(lock, 'utf8');
  const linhas = texto.split('\n');
  let resolucoes = 0;
  linhas.forEach((linha, i) => {
    const n = i + 1;
    if (/\bresolution:\s*\{/.test(linha)) {
      resolucoes++;
      if (/tarball:/.test(linha) && !linha.includes(REGISTRO)) {
        erro(`pnpm-lock.yaml:${n}: tarball fora do registro oficial: ${linha.trim()}`);
      }
      if (/\b(repo|commit|type:\s*git)\b/.test(linha)) {
        erro(`pnpm-lock.yaml:${n}: dependência resolvida via git: ${linha.trim()}`);
      }
      if (!/integrity:/.test(linha) && !/directory:/.test(linha)) {
        erro(`pnpm-lock.yaml:${n}: resolução sem hash de integridade: ${linha.trim()}`);
      }
    }
    if (/git\+(ssh|https?):\/\//.test(linha) || /codeload\.github\.com/.test(linha)) {
      erro(`pnpm-lock.yaml:${n}: referência a git: ${linha.trim()}`);
    }
  });
  info(`${resolucoes} resolução(ões) verificada(s) no lockfile.`);
}

const npmrc = join(RAIZ, '.npmrc');
if (existsSync(npmrc)) {
  const linhas = (await readFile(npmrc, 'utf8')).split('\n');
  linhas.forEach((linha, i) => {
    const l = linha.trim();
    if (!l || l.startsWith('#') || l.startsWith(';')) return;
    const m = l.match(/^(@[^:]+:)?registry\s*=\s*(.+)$/);
    if (m && m[2].trim() !== REGISTRO) erro(`.npmrc:${i + 1}: registro não permitido: ${l}`);
    if (/_authToken|_password|_auth\b/.test(l)) erro(`.npmrc:${i + 1}: credencial no .npmrc commitado.`);
  });
}

finalizar('Lockfile e registro');
