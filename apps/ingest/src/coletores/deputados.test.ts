import assert from 'node:assert/strict';
import { test } from 'node:test';
import { urlDeputadosEmExercicio, type DeputadoCamara, type RespostaBruta } from '@portal/sources';
import { baixarDeputados, conferirLote } from './deputados.ts';

const dep = (id: number) => ({
  id,
  nome: `Deputado ${id}`,
  siglaPartido: 'PX',
  siglaUf: 'SP',
  idLegislatura: 57,
  urlFoto: `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`,
  email: null,
});
const PAGINA_2 = 'https://dadosabertos.camara.leg.br/api/v2/deputados?pagina=2&itens=100';

function fetchPorUrl(respostas: Record<string, () => Response>) {
  const chamadas: string[] = [];
  const buscar = (async (url: string | URL | Request) => {
    chamadas.push(String(url));
    const r = respostas[String(url)];
    if (!r) throw new Error(`URL inesperada: ${String(url)}`);
    return r();
  }) as typeof fetch;
  return { buscar, chamadas };
}

const json = (corpo: unknown, total = 3) =>
  new Response(JSON.stringify(corpo), { status: 200, headers: { 'x-total-count': String(total) } });

test('baixarDeputados: segue a paginação e guarda cada corpo original', async () => {
  const { buscar, chamadas } = fetchPorUrl({
    [urlDeputadosEmExercicio()]: () => json({ dados: [dep(1), dep(2)], links: [{ rel: 'next', href: PAGINA_2 }] }),
    [PAGINA_2]: () => json({ dados: [dep(3)], links: [] }),
  });
  const r = await baixarDeputados({ fetch: buscar });
  assert.equal(r.erro, null);
  assert.deepEqual(chamadas, [urlDeputadosEmExercicio(), PAGINA_2]);
  assert.deepEqual(r.deputados.map((d) => d.id), [1, 2, 3]);
  assert.equal(r.paginas.length, 2);
  assert.equal(JSON.parse(r.paginas[1]!.corpo).dados[0].id, 3);
});

test('baixarDeputados: erro no meio devolve as páginas já baixadas (o raw é salvo mesmo na falha)', async () => {
  const { buscar } = fetchPorUrl({
    [urlDeputadosEmExercicio()]: () => json({ dados: [dep(1)], links: [{ rel: 'next', href: PAGINA_2 }] }),
    [PAGINA_2]: () => json({ dados: [{ ...dep(2), siglaUf: 'ZZ' }], links: [] }),
  });
  const r = await baixarDeputados({ fetch: buscar });
  assert.equal(r.erro?.name, 'ErroFormato');
  assert.equal(r.paginas.length, 2);
});

const resposta = (total?: string): RespostaBruta => ({
  url: urlDeputadosEmExercicio(),
  status: 200,
  recebidaEm: '2026-11-13T12:00:00.000Z',
  cabecalhos: total === undefined ? {} : { 'x-total-count': total },
  corpo: '',
});
const lote = (ids: number[]) => ids.map((id) => ({ ...dep(id), siglaUf: 'SP' as const }) satisfies DeputadoCamara);

test('conferirLote: ok quando bate com o X-Total-Count', () => {
  assert.equal(conferirLote(lote([1, 2]), resposta('2')), null);
});

test('conferirLote: parcial com total divergente, sem total ou id repetido', () => {
  assert.match(conferirLote(lote([1, 2]), resposta('513'))!, /declarou 513/);
  assert.match(conferirLote(lote([1, 2]), resposta())!, /X-Total-Count/);
  assert.match(conferirLote(lote([1, 1]), resposta('2'))!, /repetido/);
});
