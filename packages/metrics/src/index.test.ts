import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MET01_MIN_DIAS_REFERENCIA,
  calcularPresenca,
  distribuicao,
  mediana,
  quantil,
  referenciaPresenca,
  type FrequenciaDia,
} from './index.ts';

test('mediana: lista vazia é dado faltante (null), não zero', () => {
  assert.equal(mediana([]), null);
});

test('mediana: ímpar, par e fora de ordem', () => {
  assert.equal(mediana([7]), 7);
  assert.equal(mediana([3, 1, 2]), 2);
  assert.equal(mediana([4, 1, 3, 2]), 2.5);
});

test('mediana: não altera a lista recebida', () => {
  const valores = [3, 1, 2];
  mediana(valores);
  assert.deepEqual(valores, [3, 1, 2]);
});

test('quantil: igual ao tipo 7 do R/NumPy', () => {
  // numpy.percentile([1, 2, 3, 4, 10], [25, 75]) == [2, 4]; [1,2,3,4] → [1.75, 3.25]
  assert.equal(quantil([1, 2, 3, 4, 10], 0.25), 2);
  assert.equal(quantil([1, 2, 3, 4, 10], 0.75), 4);
  assert.equal(quantil([1, 2, 3, 4], 0.25), 1.75);
  assert.equal(quantil([1, 2, 3, 4], 0.75), 3.25);
  assert.throws(() => quantil([1], 1.5), RangeError);
  assert.throws(() => quantil([1, Number.NaN], 0.5), RangeError);
});

test('distribuicao: mediana, quartis e extremos', () => {
  assert.deepEqual(distribuicao([4, 1, 3, 2]), { n: 4, media: 2.5, mediana: 2.5, p25: 1.75, p75: 3.25, minimo: 1, maximo: 4 });
  assert.equal(distribuicao([]), null);
});

const repetir = (f: FrequenciaDia, n: number): FrequenciaDia[] => Array.from({ length: n }, () => f);

test('calcularPresenca: ausência justificada fica à parte e não conta como presença', () => {
  const r = calcularPresenca([...repetir('Presença', 7), 'Presença (~)', ...repetir('Ausência justificada', 1), ...repetir('Ausência', 1)]);
  assert.deepEqual(r, {
    dias: 10, presencas: 7, presencasSemRegistroNaSessao: 1, ausenciasJustificadas: 1, ausenciasNaoJustificadas: 1, taxaPresenca: 0.7,
  });
});

test('calcularPresenca: sem dias é dado faltante', () => {
  assert.equal(calcularPresenca([]).taxaPresenca, null);
});

test('referenciaPresenca: ignora quem tem poucos dias', () => {
  const muitos = MET01_MIN_DIAS_REFERENCIA;
  const r = referenciaPresenca([
    calcularPresenca(repetir('Presença', muitos)),
    calcularPresenca([...repetir('Presença', muitos / 2), ...repetir('Ausência', muitos / 2)]),
    calcularPresenca(repetir('Ausência', 3)),
  ]);
  assert.equal(r?.n, 2);
  assert.equal(r?.mediana, 0.75);
});
