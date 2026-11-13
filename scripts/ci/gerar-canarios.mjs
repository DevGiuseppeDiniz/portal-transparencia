// Barreira 2b (preparo) — gera valores-canário para cada segredo de servidor.
//
// Uso no CI:  node scripts/ci/gerar-canarios.mjs >> "$GITHUB_ENV"
// O build de verificação roda com esses valores. Se algum aparecer no que vai para o
// navegador, check-bundle-segredos.mjs bloqueia.

import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { RAIZ, lerJson } from './lib.mjs';

const servidor = (await lerJson(join(RAIZ, 'security/env-servidor.json'))).variaveis ?? [];
for (const nome of servidor) {
  console.log(`${nome}=CANARIO_SEGREDO_${nome}_${randomBytes(8).toString('hex')}`);
}
