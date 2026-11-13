import assert from 'node:assert/strict';
import { test } from 'node:test';
import { zipDeUmaEntrada } from './zip-de-teste.ts';
import { lerHistorico } from './camara.ts';
import { TETOS_CEAP, centavos, lerCeapCsv, lerCeapZip, tetoCeap } from './ceap.ts';
import { ErroFormato } from './camara.ts';

const CABECALHO = [
  'txNomeParlamentar', 'cpf', 'ideCadastro', 'nuCarteiraParlamentar', 'nuLegislatura', 'sgUF', 'sgPartido',
  'codLegislatura', 'numSubCota', 'txtDescricao', 'numEspecificacaoSubCota', 'txtDescricaoEspecificacao',
  'txtFornecedor', 'txtCNPJCPF', 'txtNumero', 'indTipoDocumento', 'datEmissao', 'vlrDocumento', 'vlrGlosa',
  'vlrLiquido', 'numMes', 'numAno', 'numParcela', 'txtPassageiro', 'txtTrecho', 'numLote', 'numRessarcimento',
  'datPagamentoRestituicao', 'vlrRestituicao', 'nuDeputadoId', 'ideDocumento', 'urlDocumento',
];

function linha(campos: Record<string, string>): string {
  const base: Record<string, string> = Object.fromEntries(CABECALHO.map((c) => [c, '']));
  Object.assign(base, { numAno: '2025', numMes: '3', numSubCota: '10', txtDescricao: 'TELEFONIA', vlrDocumento: '10', vlrGlosa: '0', vlrLiquido: '10' }, campos);
  return CABECALHO.map((c) => `"${base[c]!.replace(/"/g, '""')}"`).join(';');
}
const csv = (...linhas: string[]) => `﻿${CABECALHO.map((c) => `"${c}"`).join(';')}\n${linhas.join('\n')}\n`;

test('centavos: inteiro, decimal, negativo; recusa lixo', () => {
  assert.equal(centavos('1467', 'x'), 146_700);
  assert.equal(centavos('3.23', 'x'), 323);
  assert.equal(centavos('3.2', 'x'), 320);
  assert.equal(centavos('-1247', 'x'), -124_700);
  for (const ruim of ['', '1,5', '1.234', 'abc']) assert.throws(() => centavos(ruim, 'x'), ErroFormato, ruim);
});

test('lerCeapCsv: PJ, PF sem nome nem CPF, liderança sem deputado, glosa vazia', () => {
  const despesas = lerCeapCsv(
    csv(
      linha({ ideCadastro: '73579', cpf: '11939141168', txtFornecedor: 'TEL SA', txtCNPJCPF: '085.324.290/0013-1 ', vlrLiquido: '3.23', ideDocumento: '7', urlDocumento: 'https://www.camara.leg.br/cota-parlamentar/documentos/publ/1/2025/7.pdf', datEmissao: '2025-03-02T00:00:00' }),
      linha({ ideCadastro: '73579', txtFornecedor: 'Fulano de Tal', txtCNPJCPF: '123.456.789-01', txtPassageiro: 'Beltrano', vlrGlosa: '' }),
      linha({ ideCadastro: '', txtNomeParlamentar: 'LID.GOV-CD', txtFornecedor: 'X LTDA', txtCNPJCPF: '11.111.111/0001-11' }),
    ),
    2025,
  );
  assert.equal(despesas.length, 3);
  assert.deepEqual(despesas[0], {
    idCamara: 73579, ano: 2025, mes: 3, categoria: 'TELEFONIA', subcota: 10, fornecedor: 'TEL SA', cnpj: '08532429000131',
    tipoFornecedor: 'PJ', dataEmissao: '2025-03-02', valorDocumentoCentavos: 1000, valorGlosaCentavos: 0,
    valorLiquidoCentavos: 323, idDocumento: 7, urlDocumento: 'https://www.camara.leg.br/cota-parlamentar/documentos/publ/1/2025/7.pdf',
  });
  assert.equal(despesas[1]!.tipoFornecedor, 'PF');
  assert.equal(despesas[1]!.fornecedor, null);
  assert.equal(despesas[1]!.cnpj, null);
  assert.equal(despesas[1]!.valorGlosaCentavos, 0);
  assert.ok(!JSON.stringify(despesas).includes('Beltrano') && !JSON.stringify(despesas).includes('11939141168'));
  assert.equal(despesas[2]!.idCamara, null);
});

test('lerCeapCsv: recusa ano trocado, mês inválido, URL fora da Câmara e coluna faltando', () => {
  assert.throws(() => lerCeapCsv(csv(linha({ numAno: '2024' })), 2025), /ano 2024/);
  assert.throws(() => lerCeapCsv(csv(linha({ numMes: '13' })), 2025), /mês/);
  assert.throws(() => lerCeapCsv(csv(linha({ urlDocumento: 'https://malicioso.test/x.pdf' })), 2025), /fora da Câmara/);
  assert.throws(() => lerCeapCsv('"a";"b"\n"1";"2"\n', 2025), /sem as colunas/);
});

test('lerCeapZip: lê o CSV de dentro do ZIP oficial', () => {
  const zip = zipDeUmaEntrada('Ano-2025.csv', Buffer.from(csv(linha({ ideCadastro: '1' }))));
  assert.equal(lerCeapZip(zip, 2025).length, 1);
  assert.throws(() => lerCeapZip(zip, 2024), /sem Ano-2024.csv/);
});

test('tetoCeap: vale a tabela vigente no 1º dia do mês', () => {
  assert.equal(TETOS_CEAP.length, 2);
  assert.equal(tetoCeap('AC', 2026, 2)!.centavos, 5_042_626); // Ato 244 vigora desde 20/02: fevereiro ainda é o anterior
  assert.equal(tetoCeap('AC', 2026, 3)!.centavos, 5_735_987);
  assert.equal(tetoCeap('DF', 2023, 2)!.centavos, 3_658_246);
  assert.equal(tetoCeap('DF', 2023, 1), null); // antes da primeira tabela cadastrada
});

test('lerHistorico: situação nula em registro só de nome/partido', () => {
  const h = lerHistorico(JSON.stringify({ dados: [
    { dataHora: '2023-02-01T00:00', situacao: null, descricaoStatus: 'Nome no início da legislatura', idLegislatura: 57 },
    { dataHora: '2023-02-01T12:05', situacao: 'Exercício', descricaoStatus: 'Posse', idLegislatura: 57 },
  ] }));
  assert.deepEqual(h.map((x) => x.situacao), [null, 'Exercício']);
  assert.throws(() => lerHistorico('{"dados":[{"dataHora":"01/02/2023","idLegislatura":57}]}'), ErroFormato);
});
