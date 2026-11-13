// Ponto de entrada dos coletores (11-arquitetura). Roda como job agendado, sem porta HTTP
// (SEG-03). Node 24 executa TypeScript direto (type stripping), sem etapa de build.
//
// Uso: pnpm coletar [etapa ...]   (lê DATABASE_URL do .env na raiz)
//   etapas: deputados, eventos, matriculas, presenca, met01, historico, ceap, met02.
//   Sem etapa = todas, nessa ordem.

import { conectar } from '@portal/db';
import { calcularMet01 } from './calculos/met01.ts';
import { calcularMet02 } from './calculos/met02.ts';
import { periodoCeap } from '@portal/metrics';
import { coletarCeapAno, coletarHistoricos } from './coletores/ceap.ts';
import type { Dependencias, ResultadoColeta } from './coleta.ts';
import { coletarDeputados } from './coletores/deputados.ts';
import { coletarEventos, coletarMatriculas, coletarPresencas, diasParaColetar } from './coletores/presenca.ts';
import { armazenamentoEmDisco, raizRawPadrao } from './raw.ts';
import { versaoColetor } from './versao.ts';

const ETAPAS = ['deputados', 'eventos', 'matriculas', 'presenca', 'met01', 'historico', 'ceap', 'met02'] as const;
type Etapa = (typeof ETAPAS)[number];

const pedidas = process.argv.slice(2);
const invalidas = pedidas.filter((e) => !(ETAPAS as readonly string[]).includes(e));
if (invalidas.length) {
  console.error(`etapa(s) desconhecida(s): ${invalidas.join(', ')}. Válidas: ${ETAPAS.join(', ')}`);
  process.exit(2);
}
const etapas: readonly Etapa[] = pedidas.length ? (pedidas as Etapa[]) : ETAPAS;

let falhas = 0;
function relatar(nome: string, r: ResultadoColeta) {
  if (r.status !== 'sucesso') falhas++;
  console.log(`${nome}: ${r.status}, ${r.registros} registro(s), coleta ${r.coletaId}${r.erro ? `\n  motivo: ${r.erro}` : ''}`);
}

const sql = conectar(undefined, 'portal-ingest');
const deps: Dependencias = {
  sql,
  raw: armazenamentoEmDisco(raizRawPadrao()),
  versao: versaoColetor(),
  http: {
    aoTentarDeNovo: ({ url, tentativa, motivo, esperaMs }) =>
      console.warn(`tentativa ${tentativa} falhou (${motivo}); nova tentativa em ${esperaMs} ms: ${url}`),
  },
};

try {
  for (const etapa of etapas) {
    if (etapa === 'deputados') relatar('SRC-01 deputados', await coletarDeputados(deps));
    if (etapa === 'eventos') for (const r of await coletarEventos(deps)) relatar('SRC-01b eventos', r);
    if (etapa === 'matriculas') relatar('SRC-01d matrículas', await coletarMatriculas(deps));
    if (etapa === 'presenca') {
      const dias = await diasParaColetar(deps);
      console.log(`SRC-01d frequência: ${dias.length} dia(s) de sessão para coletar`);
      await coletarPresencas(deps, dias, 3, (data, r, feitos) => {
        if (r.status !== 'sucesso') relatar(`SRC-01d frequência ${data}`, r);
        else if (feitos % 25 === 0 || feitos === dias.length) console.log(`  ${feitos}/${dias.length} dias`);
      });
    }
    if (etapa === 'met01') {
      const c = await calcularMet01(sql, deps.versao);
      console.log(
        c
          ? `MET-01: cálculo ${c.calculoId}, ${c.deputados} deputados, ${c.periodo.inicio} a ${c.periodo.fim}` +
              (c.referencia ? `; mediana ${(c.referencia.mediana * 100).toFixed(1)}% (P25 ${(c.referencia.p25 * 100).toFixed(1)}%, P75 ${(c.referencia.p75 * 100).toFixed(1)}%, n=${c.referencia.n})` : '')
          : 'MET-01: sem dados de frequência para calcular',
      );
    }
    if (etapa === 'historico') relatar('SRC-01 histórico', await coletarHistoricos(deps));
    if (etapa === 'ceap') {
      // Anos do período da MET-02 e o ano corrente (o arquivo do ano muda todo dia).
      const p = periodoCeap(new Date());
      const anoAtual = new Date().getUTCFullYear();
      for (let ano = Number(p.inicio.slice(0, 4)); ano <= anoAtual; ano++) relatar(`SRC-01c CEAP ${ano}`, await coletarCeapAno(deps, ano));
    }
    if (etapa === 'met02') {
      const c = await calcularMet02(sql, deps.versao);
      console.log(
        c
          ? `MET-02: cálculo ${c.calculoId}, ${c.deputados} deputados, ${c.periodo.inicio} a ${c.periodo.fim}, referência em ${c.ufsComReferencia} UF(s)`
          : 'MET-02: nenhum deputado em exercício',
      );
    }
  }
  if (falhas) {
    console.error(`${falhas} coleta(s) sem sucesso (registradas em raw.coleta).`);
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}
