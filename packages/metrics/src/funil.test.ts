import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MET03_MIN_APRESENTADAS_TAXA, calcularFunil, classificarProposicao, referenciaFunil, type ProposicaoFunil } from './index.ts';

const prop = (tramitacoes: Array<[string, string]>, extra: Partial<ProposicaoFunil> = {}): ProposicaoFunil => ({
  siglaTipo: 'PL', situacao: null, apensadaA: null,
  tramitacoes: tramitacoes.map(([siglaOrgao, descricao]) => ({ siglaOrgao, descricao })), ...extra,
});

test('classificarProposicao: cada estágio', () => {
  assert.equal(classificarProposicao(prop([['MESA', 'Apresentação de Proposição']])).estagio, 'apresentada');
  assert.equal(classificarProposicao(prop([['CCJC', 'Designação de Relator(a)']])).estagio, 'apresentada');
  assert.equal(classificarProposicao(prop([['CSAUDE', 'Parecer do(a) Relator(a)']])).estagio, 'comissao');
  assert.equal(classificarProposicao(prop([['PLEN', 'Aprovação de Urgência (154, 155 ou 64 CF)']])).estagio, 'alem_comissao');
  assert.equal(classificarProposicao(prop([['PLEN', 'Parecer do(a) Relator(a)']])).estagio, 'alem_comissao');
  assert.equal(classificarProposicao(prop([['MESA', 'Remessa ao Senado Federal']])).estagio, 'aprovada_camara');
  assert.equal(classificarProposicao(prop([['MESA', 'Transformação em Norma Jurídica']])).estagio, 'lei');
});

test('classificarProposicao: aprovação conclusiva (sem Plenário) conta como aprovada pela situação', () => {
  const c = classificarProposicao(prop([['CCJC', 'Parecer do(a) Relator(a)']], { situacao: 'Aguardando Apreciação pelo Senado Federal' }));
  assert.equal(c.estagio, 'aprovada_camara');
  assert.equal(classificarProposicao(prop([], { situacao: 'Transformado em Norma Jurídica' })).estagio, 'lei');
});

test('classificarProposicao: aprovação em Plenário de PEC (1º turno) não é aprovação final', () => {
  assert.equal(classificarProposicao(prop([['PLEN', 'Aprovação de Proposição (Plenário)']], { siglaTipo: 'PEC' })).estagio, 'alem_comissao');
  assert.equal(classificarProposicao(prop([['PLEN', 'Aprovação de Proposição (Plenário)']])).estagio, 'aprovada_camara');
});

test('classificarProposicao: apensada e encerradas', () => {
  assert.equal(classificarProposicao(prop([], { situacao: 'Tramitando em Conjunto' })).apensada, true);
  assert.equal(classificarProposicao(prop([], { apensadaA: 123 })).apensada, true);
  assert.equal(classificarProposicao(prop([], { situacao: 'Arquivada' })).encerrada, 'arquivada');
  assert.equal(classificarProposicao(prop([], { situacao: 'Retirado pelo(a) Autor(a)' })).encerrada, 'retirada');
  assert.equal(classificarProposicao(prop([], { situacao: 'Devolvida ao(à) Autor(a)' })).encerrada, 'devolvida');
});

test('calcularFunil: conta "chegou pelo menos até" e apensadas à parte', () => {
  const f = calcularFunil([
    { estagio: 'lei', apensada: false, encerrada: null },
    { estagio: 'comissao', apensada: false, encerrada: 'arquivada' },
    { estagio: 'apresentada', apensada: true, encerrada: null },
    { estagio: 'apresentada', apensada: true, encerrada: null },
  ]);
  assert.deepEqual(f.porEstagio, { apresentada: 4, comissao: 2, alem_comissao: 1, aprovada_camara: 1, lei: 1 });
  assert.equal(f.apensadas, 2);
  assert.equal(f.arquivadas, 1);
  assert.equal(f.taxaLei, 0.25);
  assert.equal(calcularFunil([]).taxaLei, null);
});

test('referenciaFunil: taxa de lei só de quem apresentou o mínimo', () => {
  const muitos = Array.from({ length: MET03_MIN_APRESENTADAS_TAXA }, () => ({ estagio: 'apresentada' as const, apensada: false, encerrada: null }));
  const r = referenciaFunil([
    calcularFunil([...muitos.slice(1), { estagio: 'lei', apensada: false, encerrada: null }]),
    calcularFunil(muitos),
    calcularFunil([{ estagio: 'lei', apensada: false, encerrada: null }]),
  ]);
  assert.equal(r.taxaLei?.n, 2);
  assert.equal(r.porEstagio.apresentada?.n, 3);
  assert.equal(r.porEstagio.lei?.mediana, 1);
});

test('posicaoRelativa: menores, iguais e total; sem valor é faltante', async () => {
  const { posicaoRelativa } = await import('./publicacao.ts');
  assert.deepEqual(posicaoRelativa(0.9, [0.5, 0.9, 0.95, 0.8]), { menores: 2, iguais: 1, total: 4 });
  assert.equal(posicaoRelativa(null, [1]), null);
  assert.equal(posicaoRelativa(1, []), null);
});
