import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lerObterDeputados, lerPresencasDia, urlPresencasDia } from './camara-legado.ts';
import { ErroFormato, lerArquivoEventos, urlEventosAno } from './camara.ts';

const parlamentar = (carteira: number, freq: string, justificativa = '', sessoes = ['Presença']) => `
    <parlamentar>
      <carteiraParlamentar>${carteira}</carteiraParlamentar>
      <nomeParlamentar>Fulano ${carteira}-PX/SP</nomeParlamentar>
      <siglaPartido>PX        </siglaPartido>
      <siglaUF>SP</siglaUF>
      <descricaoFrequenciaDia>${freq}</descricaoFrequenciaDia>
      <justificativa>${justificativa}
      </justificativa>
      <presencaExterna>0</presencaExterna>
      <sessoesDia>${sessoes.map((f) => `<sessaoDia><inicio>08/10/2025 11:55:00</inicio><descricao>EXTRAORDINÁRIA</descricao><frequencia>${f}</frequencia></sessaoDia>`).join('')}</sessoesDia>
    </parlamentar>`;

const dia = (...ps: string[]) =>
  `<?xml version="1.0" encoding="utf-8"?>\n<dia><data>08/10/2025 11:40:03</data><qtdeSessoesDia>2</qtdeSessoesDia><legislatura>57</legislatura><parlamentares>${ps.join('')}</parlamentares></dia>`;

test('urlPresencasDia: formato exigido pelo webservice', () => {
  assert.equal(
    urlPresencasDia('2025-10-08', 57),
    'https://www.camara.leg.br/SitCamaraWS/sessoesreunioes.asmx/ListarPresencasDia?data=08/10/2025&numLegislatura=57&numMatriculaParlamentar=&siglaPartido=&siglaUF=',
  );
  assert.throws(() => urlPresencasDia('08/10/2025', 57), ErroFormato);
});

test('lerPresencasDia: presença, ausência justificada com motivo e sessões', () => {
  const r = lerPresencasDia(
    dia(parlamentar(10, 'Presença', '', ['Presença', 'Ausência']), parlamentar(129, 'Ausência justificada', 'Missão Autorizada', ['Ausência'])),
    '2025-10-08',
  );
  assert.equal(r.qtdeSessoes, 2);
  assert.deepEqual(r.presencas[0], {
    matricula: 10, nomeParlamentar: 'Fulano 10-PX/SP', siglaPartido: 'PX', siglaUf: 'SP',
    frequencia: 'Presença', justificativa: null, sessoes: 2, sessoesPresente: 1,
  });
  assert.equal(r.presencas[1]!.frequencia, 'Ausência justificada');
  assert.equal(r.presencas[1]!.justificativa, 'Missão Autorizada');
});

test('lerPresencasDia: <dia /> é dia sem frequência registrada', () => {
  assert.deepEqual(lerPresencasDia('<?xml version="1.0"?>\n<dia />', '2025-10-12'), { data: '2025-10-12', qtdeSessoes: 0, presencas: [] });
});

test('lerPresencasDia: recusa dia trocado, frequência desconhecida e matrícula repetida', () => {
  assert.throws(() => lerPresencasDia(dia(parlamentar(10, 'Presença')), '2025-10-09'), /não é o dia pedido/);
  assert.throws(() => lerPresencasDia(dia(parlamentar(10, 'Talvez')), '2025-10-08'), /desconhecida/);
  assert.equal(lerPresencasDia(dia(parlamentar(10, 'Presença (~)', '', ['Ausência'])), '2025-10-08').presencas[0]!.frequencia, 'Presença (~)');
  assert.throws(() => lerPresencasDia(dia(parlamentar(10, 'Presença'), parlamentar(10, 'Ausência')), '2025-10-08'), /repetida/);
  assert.throws(() => lerPresencasDia('<deputados/>', '2025-10-08'), /raiz/);
});

test('lerObterDeputados: liga matrícula ao id da API v2', () => {
  const xml = `<deputados><deputado><ideCadastro>73808</ideCadastro><condicao>Titular</condicao><matricula>213</matricula>
    <nomeParlamentar>Sérgio Brito</nomeParlamentar><uf>BA</uf></deputado></deputados>`;
  assert.deepEqual(lerObterDeputados(xml), [
    { matricula: 213, idCamara: 73808, nomeParlamentar: 'Sérgio Brito', condicao: 'Titular', siglaUf: 'BA' },
  ]);
  assert.throws(() => lerObterDeputados(xml.replace('73808', 'abc')), ErroFormato);
});

test('lerArquivoEventos: campos usados e validação', () => {
  const ev = { id: 1, dataHoraInicio: '2025-02-04T14:00:00', descricaoTipo: 'Sessão Deliberativa', situacao: 'Encerrada', localCamara: { nome: 'Plenário' } };
  assert.deepEqual(lerArquivoEventos(JSON.stringify({ dados: [ev] })), [
    { id: 1, dataHoraInicio: '2025-02-04T14:00:00', descricaoTipo: 'Sessão Deliberativa', situacao: 'Encerrada', local: 'Plenário' },
  ]);
  assert.throws(() => lerArquivoEventos(JSON.stringify({ dados: [{ ...ev, dataHoraInicio: '04/02/2025' }] })), ErroFormato);
  assert.equal(urlEventosAno(2025), 'https://dadosabertos.camara.leg.br/arquivos/eventos/json/eventos-2025.json');
});
