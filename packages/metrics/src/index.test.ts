import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mediana } from './index.ts';

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
