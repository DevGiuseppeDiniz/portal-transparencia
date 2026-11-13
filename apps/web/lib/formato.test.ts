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

test('percentual: nunca arredonda para 100% ou 0% o que não é (392 de 393 dias)', () => {
  assert.equal(percentual(392 / 393), '99,7%');
  assert.equal(percentual(0.9999), '99,99%');
  assert.equal(percentual(1), '100%');
  assert.equal(percentual(0.004), '0,4%');
  assert.equal(percentual(0), '0%');
  assert.equal(percentual(0.851), '85%');
});

test('doEstado: artigo certo de cada estado', async () => {
  const { doEstado, UFS } = await import('./ufs.ts');
  assert.equal(doEstado('PR'), 'do Paraná');
  assert.equal(doEstado('BA'), 'da Bahia');
  assert.equal(doEstado('SP'), 'de São Paulo');
  assert.equal(doEstado('AL'), 'de Alagoas');
  assert.equal(doEstado('DF'), 'do Distrito Federal');
  for (const u of UFS) assert.match(doEstado(u.sigla), /^(do|da|de) /, u.sigla);
});
