import assert from 'node:assert/strict';
import { test } from 'node:test';
import { avaliarInvalidas } from './proposicoes.ts';

const leitura = (total: number, invalidas: Array<{ linha: number; motivo: string }>) => ({ itens: [], total, invalidas });

test('avaliarInvalidas: sem inválidas, sem aviso', () => {
  assert.equal(avaliarInvalidas(leitura(1000, [])), null);
});

test('avaliarInvalidas: poucas linhas ruins no meio viram aviso registrado na coleta', () => {
  assert.match(avaliarInvalidas(leitura(100_000, [{ linha: 50_695, motivo: '1 colunas, cabeçalho tem 14' }]))!, /aviso: 1 linha/);
});

test('avaliarInvalidas: registro cortado no fim do arquivo é falha (arquivo incompleto)', () => {
  assert.throws(() => avaliarInvalidas(leitura(100_000, [{ linha: 42_887, motivo: 'registro truncado no fim do arquivo (aspas sem fechamento)' }])), /incompleto/);
});

test('avaliarInvalidas: acima do limite é falha', () => {
  const muitas = Array.from({ length: 30 }, (_, i) => ({ linha: i, motivo: 'x' }));
  assert.throws(() => avaliarInvalidas(leitura(1_000_000, muitas)), /acima do limite/);
  assert.throws(() => avaliarInvalidas(leitura(100, [{ linha: 3, motivo: 'x' }])), /acima do limite/);
});
