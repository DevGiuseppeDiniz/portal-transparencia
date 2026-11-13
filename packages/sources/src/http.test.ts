import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ErroHttp, lerRetryAfter, obter } from './http.ts';

type Passo = Response | Error;

function fetchFalso(passos: Passo[]) {
  const chamadas: string[] = [];
  const buscar = (async (url: string | URL | Request) => {
    chamadas.push(String(url));
    const passo = passos.shift();
    if (!passo) throw new Error('chamada a mais');
    if (passo instanceof Error) throw passo;
    return passo;
  }) as typeof fetch;
  return { buscar, chamadas };
}

const esperas: number[] = [];
const esperar = async (ms: number) => {
  esperas.push(ms);
};

test('obter: devolve o corpo original e os cabeçalhos relevantes', async () => {
  const { buscar } = fetchFalso([
    new Response('{"dados":[]}', { status: 200, headers: { 'x-total-count': '0', 'set-cookie': 'x=1' } }),
  ]);
  const r = await obter('https://exemplo.test/a', { fetch: buscar, esperar });
  assert.equal(r.corpo, '{"dados":[]}');
  assert.equal(r.status, 200);
  assert.equal(r.cabecalhos['x-total-count'], '0');
  assert.equal(r.cabecalhos['set-cookie'], undefined);
});

test('obter: tenta de novo em 503 e em falha de rede', async () => {
  esperas.length = 0;
  const { buscar, chamadas } = fetchFalso([
    new Response('', { status: 503 }),
    new TypeError('fetch failed'),
    new Response('ok', { status: 200 }),
  ]);
  const r = await obter('https://exemplo.test/b', { fetch: buscar, esperar });
  assert.equal(r.corpo, 'ok');
  assert.equal(chamadas.length, 3);
  assert.deepEqual(esperas, [1000, 2000]);
});

test('obter: respeita Retry-After no 429', async () => {
  esperas.length = 0;
  const { buscar } = fetchFalso([
    new Response('', { status: 429, headers: { 'retry-after': '7' } }),
    new Response('ok', { status: 200 }),
  ]);
  await obter('https://exemplo.test/c', { fetch: buscar, esperar });
  assert.deepEqual(esperas, [7000]);
});

test('obter: 404 não tem retry', async () => {
  const { buscar, chamadas } = fetchFalso([new Response('', { status: 404 })]);
  await assert.rejects(obter('https://exemplo.test/d', { fetch: buscar, esperar }), (e: unknown) => {
    assert.ok(e instanceof ErroHttp);
    assert.equal(e.status, 404);
    return true;
  });
  assert.equal(chamadas.length, 1);
});

test('obter: esgota as tentativas e devolve o último erro', async () => {
  const { buscar, chamadas } = fetchFalso([
    new Response('', { status: 500 }),
    new Response('', { status: 502 }),
  ]);
  await assert.rejects(obter('https://exemplo.test/e', { fetch: buscar, esperar, tentativas: 2 }), /HTTP 502/);
  assert.equal(chamadas.length, 2);
});

test('lerRetryAfter: segundos, data HTTP e lixo', () => {
  assert.equal(lerRetryAfter('30'), 30_000);
  assert.equal(lerRetryAfter('Fri, 13 Nov 2026 14:00:10 GMT', Date.parse('2026-11-13T14:00:00Z')), 10_000);
  assert.equal(lerRetryAfter('amanhã'), null);
  assert.equal(lerRetryAfter(null), null);
});
