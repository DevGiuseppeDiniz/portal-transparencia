import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ErroFormato, lerPaginaDeputados, urlDeputadosEmExercicio } from './camara.ts';

const deputado = {
  id: 204379,
  uri: 'https://dadosabertos.camara.leg.br/api/v2/deputados/204379',
  nome: 'Acácio Favacho',
  siglaPartido: 'MDB',
  uriPartido: 'https://dadosabertos.camara.leg.br/api/v2/partidos/36899',
  siglaUf: 'AP',
  idLegislatura: 57,
  urlFoto: 'https://www.camara.leg.br/internet/deputado/bandep/204379.jpg',
  email: 'dep.acaciofavacho@camara.leg.br',
};

const pagina = (dados: unknown[], links: unknown[] = []) => JSON.stringify({ dados, links });

test('lerPaginaDeputados: lê o formato real da API', () => {
  const proxima = 'https://dadosabertos.camara.leg.br/api/v2/deputados?pagina=2&itens=100';
  const r = lerPaginaDeputados(pagina([deputado], [{ rel: 'self', href: urlDeputadosEmExercicio() }, { rel: 'next', href: proxima }]));
  assert.deepEqual(r.dados, [
    {
      id: 204379,
      nome: 'Acácio Favacho',
      siglaPartido: 'MDB',
      siglaUf: 'AP',
      idLegislatura: 57,
      urlFoto: 'https://www.camara.leg.br/internet/deputado/bandep/204379.jpg',
      email: 'dep.acaciofavacho@camara.leg.br',
    },
  ]);
  assert.equal(r.proxima, proxima);
});

test('lerPaginaDeputados: última página não tem próxima', () => {
  assert.equal(lerPaginaDeputados(pagina([deputado], [{ rel: 'last', href: urlDeputadosEmExercicio() }])).proxima, null);
});

test('lerPaginaDeputados: e-mail, partido e foto nulos ou vazios viram null', () => {
  const [d] = lerPaginaDeputados(pagina([{ ...deputado, email: null, siglaPartido: '', urlFoto: null }])).dados;
  assert.equal(d!.email, null);
  assert.equal(d!.siglaPartido, null);
  assert.equal(d!.urlFoto, null);
});

test('lerPaginaDeputados: rejeita formato inesperado (SEG-06)', () => {
  const casos: Array<[string, string]> = [
    ['não é JSON', '<html>'],
    ['sem dados', '{}'],
    ['UF desconhecida', pagina([{ ...deputado, siglaUf: 'XX' }])],
    ['id negativo', pagina([{ ...deputado, id: -1 }])],
    ['id em texto', pagina([{ ...deputado, id: '204379' }])],
    ['nome vazio', pagina([{ ...deputado, nome: '  ' }])],
    ['foto sem https', pagina([{ ...deputado, urlFoto: 'http://www.camara.leg.br/f.jpg' }])],
    ['foto javascript:', pagina([{ ...deputado, urlFoto: 'javascript:alert(1)' }])],
    ['e-mail inválido', pagina([{ ...deputado, email: 'não é e-mail' }])],
  ];
  for (const [nome, corpo] of casos) {
    assert.throws(() => lerPaginaDeputados(corpo), ErroFormato, nome);
  }
});

test('lerPaginaDeputados: não segue link de próxima página fora da API da Câmara', () => {
  for (const href of ['https://malicioso.test/api/v2/deputados?pagina=2', 'https://dadosabertos.camara.leg.br/outra-coisa']) {
    assert.throws(() => lerPaginaDeputados(pagina([deputado], [{ rel: 'next', href }])), ErroFormato, href);
  }
});
