import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MET02_MIN_MESES_REFERENCIA,
  calcularCota,
  mesesEmExercicio,
  periodoCeap,
  referenciaCotaPorUf,
  type DespesaCota,
} from './index.ts';

test('periodoCeap: 12 meses fechados com o prazo de 90 dias encerrado', () => {
  const p = periodoCeap(new Date('2026-11-13T12:00:00Z'));
  // 13/11 − 90 dias = 15/08 → último mês completo antes disso: julho/2026.
  assert.equal(p.fim, '2026-07');
  assert.equal(p.inicio, '2025-08');
  assert.equal(p.meses.length, 12);
  assert.equal(periodoCeap(new Date('2026-03-05T12:00:00Z')).fim, '2025-11');
});

test('mesesEmExercicio: licença no meio e volta', () => {
  const meses = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05'];
  const historico = [
    { dataHora: '2023-02-01T12:05', situacao: 'Exercício' },
    { dataHora: '2023-02-01T00:00', situacao: null },
    { dataHora: '2025-02-10T10:00', situacao: 'Licença' },
    { dataHora: '2025-04-01T00:00', situacao: 'Exercício' },
    { dataHora: '2025-04-15T00:00', situacao: 'Exercício' },
  ];
  assert.deepEqual(mesesEmExercicio(historico, meses), ['2025-01', '2025-02', '2025-04', '2025-05']);
  assert.deepEqual(mesesEmExercicio([], meses), []);
  assert.deepEqual(mesesEmExercicio([{ dataHora: '2025-03-31T23:59', situacao: 'Exercício' }], meses), ['2025-03', '2025-04', '2025-05']);
});

const desp = (mes: string, centavos: number, extra: Partial<DespesaCota> = {}): DespesaCota => ({
  mes, categoria: 'TELEFONIA', fornecedor: 'TEL SA', cnpj: '11111111000111', tipoFornecedor: 'PJ', centavos, ...extra,
});

test('calcularCota: só meses em exercício, teto somado mês a mês, PF sem nome', () => {
  const c = calcularCota(
    [
      desp('2025-01', 10_000),
      desp('2025-01', -2_000),
      desp('2025-02', 5_000, { categoria: 'COMBUSTÍVEIS', fornecedor: null, cnpj: null, tipoFornecedor: 'PF' }),
      desp('2025-03', 99_999), // mês fora do exercício: não entra
    ],
    ['2025-01', '2025-02'],
    (m) => (m === '2025-01' ? 40_000 : 60_000),
  );
  assert.equal(c.gastoCentavos, 13_000);
  assert.equal(c.tetoCentavos, 100_000);
  assert.equal(c.percentualTeto, 0.13);
  assert.deepEqual(c.porCategoria, [{ categoria: 'TELEFONIA', centavos: 8_000 }, { categoria: 'COMBUSTÍVEIS', centavos: 5_000 }]);
  assert.deepEqual(c.fornecedores.map((f) => [f.fornecedor, f.cnpj, f.documentos]), [['TEL SA', '11111111000111', 2], ['Pessoa física', null, 1]]);
  assert.equal(c.concentracaoTop3, 1);
});

test('calcularCota: sem meses em exercício é dado faltante', () => {
  const c = calcularCota([], [], () => 1);
  assert.equal(c.percentualTeto, null);
  assert.equal(c.concentracaoTop3, null);
});

test('referenciaCotaPorUf: média por UF, ignorando quem tem poucos meses', () => {
  const meses = Array.from({ length: MET02_MIN_MESES_REFERENCIA }, (_, i) => `2025-${String(i + 1).padStart(2, '0')}`);
  const cota = (gasto: number, ms: string[]) => calcularCota(ms.map((m) => desp(m, gasto)), ms, () => 100);
  const ref = referenciaCotaPorUf([
    { uf: 'SP', cota: cota(50, meses) },
    { uf: 'SP', cota: cota(100, meses) },
    { uf: 'SP', cota: cota(0, ['2025-01']) },
    { uf: 'AC', cota: cota(20, meses) },
  ]);
  assert.equal(ref.get('SP')?.n, 2);
  assert.equal(ref.get('SP')?.media, 0.75);
  assert.equal(ref.get('AC')?.media, 0.2);
});
