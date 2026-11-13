// Barreira 2a — variáveis NEXT_PUBLIC_ (vão para o JavaScript que o visitante baixa).
//
// - Toda NEXT_PUBLIC_* usada no código precisa estar em security/env-publicas.json.
// - Nenhuma NEXT_PUBLIC_* pode ter nome de segredo (KEY, SECRET, TOKEN, ...), mesmo aprovada.
// - Nenhuma variável de servidor (security/env-servidor.json) pode começar com NEXT_PUBLIC_.
// - Arquivos .env reais não podem estar versionados (só .env.example).

import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';
import { RAIZ, erro, aviso, info, finalizar, lerJson, percorrer, rel } from './lib.mjs';

const NOME_SUSPEITO = /(KEY|SECRET|TOKEN|PASS|PWD|PRIVATE|CREDENTIAL|AUTH|DATABASE|DB_|CONN|SENHA|CHAVE)/i;
const EXTENSOES = /\.(ts|tsx|js|jsx|mjs|cjs|json|ya?ml|toml)$/;
// Documentação e as próprias barreiras citam o prefixo em texto; não são código do app.
const IGNORAR_PREFIXOS = ['docs/', 'security/', 'scripts/ci/', '.github/'];

const publicas = (await lerJson(join(RAIZ, 'security/env-publicas.json'))).variaveis ?? {};
const servidor = (await lerJson(join(RAIZ, 'security/env-servidor.json'))).variaveis ?? [];

for (const nome of Object.keys(publicas)) {
  if (!nome.startsWith('NEXT_PUBLIC_')) erro(`env-publicas.json: "${nome}" não começa com NEXT_PUBLIC_.`);
  if (NOME_SUSPEITO.test(nome)) erro(`env-publicas.json: "${nome}" tem nome de segredo. Segredo nunca é público.`);
}
for (const nome of servidor) {
  if (nome.startsWith('NEXT_PUBLIC_')) erro(`env-servidor.json: "${nome}" é segredo de servidor e não pode ter prefixo NEXT_PUBLIC_.`);
}

let usos = 0;
for await (const arquivo of percorrer(RAIZ)) {
  const r = rel(arquivo);
  if (IGNORAR_PREFIXOS.some((p) => r.startsWith(p))) continue;
  const ehEnv = basename(arquivo).startsWith('.env');
  if (!EXTENSOES.test(arquivo) && !ehEnv) continue;
  const texto = await readFile(arquivo, 'utf8');
  for (const m of texto.matchAll(/\bNEXT_PUBLIC_[A-Z0-9_]+/g)) {
    usos++;
    const nome = m[0];
    const linha = texto.slice(0, m.index).split('\n').length;
    if (!(nome in publicas)) erro(`${r}:${linha}: "${nome}" não está aprovada em security/env-publicas.json.`);
    if (NOME_SUSPEITO.test(nome)) erro(`${r}:${linha}: "${nome}" tem nome de segredo e iria para o navegador.`);
  }
}

try {
  const versionados = execFileSync('git', ['ls-files'], { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n');
  for (const f of versionados) {
    const nome = basename(f);
    if (/^\.env(\..+)?$/.test(nome) && nome !== '.env.example') {
      erro(`${f}: arquivo .env versionado. Segredos ficam no cofre/variáveis do CI, nunca no git.`);
    }
  }
} catch {
  aviso('Não é um repositório git; verificação de .env versionado pulada.');
}

info(`${usos} uso(s) de NEXT_PUBLIC_ encontrado(s).`);
finalizar('Variáveis públicas (NEXT_PUBLIC_)');
