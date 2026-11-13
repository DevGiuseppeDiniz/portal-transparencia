import assert from 'node:assert/strict';
import { test } from 'node:test';
import { frasePosicao, percentual } from './formato.ts';

const t = { maiorQue: 'Presença maior que a de', nenhumAcima: 'Nenhum deputado tem presença maior', valor: '100%' };

test('frasePosicao: empate no topo não diz "maior que" (o caso do 100%)', () => {
  assert.equal(frasePosicao({ menores: 490, iguais: 22, total: 512 }, t), 'Nenhum deputado tem presença maior: outros 21 também têm 100%.');
});

test('frasePosicao: sozinho no topo', () => {
  assert.equal(frasePosicao({ menores: 511, iguais: 1, total: 512 }, t), 'Nenhum deputado tem presença maior entre os outros 511.');
});

test('frasePosicao: caso geral, com e sem empate', () => {
  assert.equal(frasePosicao({ menores: 300, iguais: 5, total: 512 }, t), 'Presença maior que a de 300 dos 512 deputados e igual à de outros 4.');
  assert.equal(frasePosicao({ menores: 53, iguais: 1, total: 512 }, t), 'Presença maior que a de 53 dos 512 deputados.');
});

test('percentual: nunca "-0%" e dado faltante explícito', () => {
  assert.equal(percentual(-0), '0%');
  assert.equal(percentual(null), 'sem dado');
});
