// Ponto de entrada dos coletores (11-arquitetura). Roda como job agendado, sem porta HTTP
// (SEG-03). Node 24 executa TypeScript direto (type stripping), sem etapa de build.
//
// Uso: pnpm coletar   (lê DATABASE_URL do .env na raiz; ver docs/11-arquitetura.md)

import { conectar } from '@portal/db';
import { coletarDeputados } from './coletores/deputados.ts';
import { armazenamentoEmDisco, raizRawPadrao } from './raw.ts';
import { versaoColetor } from './versao.ts';

const sql = conectar(undefined, 'portal-ingest');
try {
  const resultado = await coletarDeputados({
    sql,
    raw: armazenamentoEmDisco(raizRawPadrao()),
    versao: versaoColetor(),
    http: {
      aoTentarDeNovo: ({ url, tentativa, motivo, esperaMs }) =>
        console.warn(`tentativa ${tentativa} falhou (${motivo}); nova tentativa em ${esperaMs} ms: ${url}`),
    },
  });
  console.log(
    `SRC-01 deputados: ${resultado.status}, ${resultado.registros} registro(s), coleta ${resultado.coletaId}` +
      (resultado.raw ? `, raw ${resultado.raw.caminho}` : '') +
      (resultado.erro ? `\n  motivo: ${resultado.erro}` : ''),
  );
  if (resultado.status !== 'sucesso') process.exitCode = 1;
} finally {
  await sql.end();
}
