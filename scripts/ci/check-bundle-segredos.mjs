// Barreira 2b — segredo no que o navegador recebe.
//
// Uso: node scripts/ci/check-bundle-segredos.mjs <dir-do-app>
// Varre o build já gerado:
//   - .next/static/**                         (JS/CSS enviados ao navegador)
//   - .next/server/{app,pages}/**.{html,rsc,body,json,txt}  (páginas pré-renderizadas)
//   - out/**                                  (export estático, se houver)
// Bloqueia se encontrar:
//   - qualquer valor-canário (CANARIO_SEGREDO_*);
//   - o valor real (ou base64 dele) de qualquer variável de security/env-servidor.json
//     presente no ambiente;
//   - padrões genéricos de segredo (chave privada, URL de banco com senha, tokens).

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, erro, info, finalizar, lerJson, percorrer, rel } from './lib.mjs';

const app = process.argv[2];
if (!app) {
  console.error('uso: check-bundle-segredos.mjs <dir-do-app>');
  process.exit(2);
}
const base = join(RAIZ, app);

const alvos = [
  { dir: join(base, '.next/static'), filtro: () => true },
  { dir: join(base, '.next/server/app'), filtro: (f) => /\.(html|rsc|body|json|txt|meta)$/.test(f) },
  { dir: join(base, '.next/server/pages'), filtro: (f) => /\.(html|json)$/.test(f) },
  { dir: join(base, 'out'), filtro: () => true },
];

if (!alvos.some((a) => existsSync(a.dir))) {
  erro(`Nenhum build encontrado em ${app}. Esta barreira exige o build pronto (falha fechada).`);
  finalizar('Segredos no bundle do navegador');
}

const PADROES = [
  [/CANARIO_SEGREDO_[A-Z0-9_]+/, 'valor-canário de segredo de servidor'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'chave privada'],
  [/\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis):\/\/[^:\s"'/]+:[^@\s"']+@/, 'URL de banco com senha'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'chave de acesso AWS'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, 'token do GitHub'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, 'token do Slack'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'chave de API do Google'],
  [/\bsk-[A-Za-z0-9_-]{32,}/, 'chave de API (sk-)'],
];

const servidor = (await lerJson(join(RAIZ, 'security/env-servidor.json'))).variaveis ?? [];
const valores = [];
for (const nome of servidor) {
  const v = process.env[nome];
  if (v && v.length >= 8) {
    valores.push([v, nome]);
    valores.push([Buffer.from(v).toString('base64'), `${nome} (base64)`]);
  }
}

let arquivos = 0;
for (const { dir, filtro } of alvos) {
  for await (const arquivo of percorrer(dir, { ignorar: new Set(['node_modules', 'cache']) })) {
    if (!filtro(arquivo)) continue;
    arquivos++;
    const texto = await readFile(arquivo, 'utf8');
    for (const [re, descricao] of PADROES) {
      const m = texto.match(re);
      if (m) erro(`${rel(arquivo)}: ${descricao} encontrado no que vai para o navegador ("${m[0].slice(0, 40)}…").`);
    }
    for (const [valor, nome] of valores) {
      if (texto.includes(valor)) erro(`${rel(arquivo)}: valor do segredo ${nome} vazou para o navegador.`);
    }
  }
}

info(`${arquivos} arquivo(s) do build varrido(s); ${valores.length / 2} segredo(s) de servidor checado(s) por valor.`);
finalizar('Segredos no bundle do navegador');
