// SRC-01d — Câmara, webservices legados (SitCamaraWS), em XML.
// Usado só onde a API v2 não tem o dado: a frequência oficial em Plenário com ausência
// justificada e o motivo (MET-01), e a matrícula que liga essa frequência ao id da API v2.
// docs/fontes/deputado-federal.md#src-01d

import { ErroFormato, UFS, type Uf } from './camara.ts';
import { ErroXml, filhos, lerXml, textoDe, type NoXml } from './xml.ts';

export const CAMARA_WS = 'https://www.camara.leg.br/SitCamaraWS';

/**
 * "Presença (~)": presença consolidada no dia, mas a sessão registra ausência (visto no dado;
 * o símbolo não tem legenda oficial publicada). Ver docs/04-metricas.md#met-01.
 */
export const FREQUENCIAS_DIA = ['Presença', 'Presença (~)', 'Ausência', 'Ausência justificada'] as const;
export type FrequenciaDia = (typeof FREQUENCIAS_DIA)[number];

export interface MatriculaDeputado {
  readonly matricula: number;
  /** = id da API v2 (SRC-01). */
  readonly idCamara: number;
  readonly nomeParlamentar: string;
  readonly condicao: string;
  readonly siglaUf: Uf;
}

export interface PresencaDia {
  readonly matricula: number;
  readonly nomeParlamentar: string;
  readonly siglaPartido: string | null;
  readonly siglaUf: Uf;
  readonly frequencia: FrequenciaDia;
  readonly justificativa: string | null;
  readonly sessoes: number;
  readonly sessoesPresente: number;
}

export interface DiaDePresenca {
  /** AAAA-MM-DD */
  readonly data: string;
  readonly qtdeSessoes: number;
  readonly presencas: readonly PresencaDia[];
}

export function urlObterDeputados(): string {
  return `${CAMARA_WS}/Deputados.asmx/ObterDeputados`;
}

/** data em AAAA-MM-DD. O webservice exige todos os parâmetros, mesmo vazios. */
export function urlPresencasDia(data: string, legislatura: number): string {
  const [a, m, d] = validarData(data).split('-');
  return (
    `${CAMARA_WS}/sessoesreunioes.asmx/ListarPresencasDia?data=${d}/${m}/${a}` +
    `&numLegislatura=${legislatura}&numMatriculaParlamentar=&siglaPartido=&siglaUF=`
  );
}

function validarData(data: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(`${data}T00:00:00Z`))) {
    throw new ErroFormato(`data inválida: ${data}`);
  }
  return data;
}

function raiz(corpo: string, nomeEsperado: string): NoXml {
  let no: NoXml;
  try {
    no = lerXml(corpo);
  } catch (e) {
    throw new ErroFormato(`XML inválido: ${e instanceof ErroXml ? e.message : String(e)}`);
  }
  if (no.nome !== nomeEsperado) throw new ErroFormato(`raiz <${no.nome}>, esperado <${nomeEsperado}>`);
  return no;
}

function obrigatorio(no: NoXml, campo: string, onde: string, max = 200): string {
  const v = textoDe(no, campo);
  if (v === null || v === '' || v.length > max) throw new ErroFormato(`${onde}.${campo}: ausente, vazio ou longo demais`);
  return v;
}

function inteiro(no: NoXml, campo: string, onde: string, minimo: number): number {
  const v = obrigatorio(no, campo, onde, 12);
  const n = Number(v);
  if (!/^\d+$/.test(v) || !Number.isSafeInteger(n) || n < minimo) throw new ErroFormato(`${onde}.${campo}: inteiro inválido "${v}"`);
  return n;
}

function uf(no: NoXml, campo: string, onde: string): Uf {
  const v = obrigatorio(no, campo, onde, 2);
  if (!(UFS as readonly string[]).includes(v)) throw new ErroFormato(`${onde}.${campo}: UF desconhecida "${v}"`);
  return v as Uf;
}

export function lerObterDeputados(corpo: string): MatriculaDeputado[] {
  return filhos(raiz(corpo, 'deputados'), 'deputado').map((d, i) => {
    const onde = `deputado[${i}]`;
    return {
      matricula: inteiro(d, 'matricula', onde, 1),
      idCamara: inteiro(d, 'ideCadastro', onde, 1),
      nomeParlamentar: obrigatorio(d, 'nomeParlamentar', onde),
      condicao: obrigatorio(d, 'condicao', onde, 30),
      siglaUf: uf(d, 'uf', onde),
    };
  });
}

/** Lê a frequência de um dia. `dataEsperada` (AAAA-MM-DD) confere que a resposta é do dia pedido. */
export function lerPresencasDia(corpo: string, dataEsperada: string): DiaDePresenca {
  const dia = raiz(corpo, 'dia');
  // Dia sem sessão com frequência registrada: o webservice devolve <dia />.
  if (dia.filhos.length === 0) return { data: dataEsperada, qtdeSessoes: 0, presencas: [] };

  const dataBruta = obrigatorio(dia, 'data', 'dia', 30);
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(dataBruta);
  const data = m ? `${m[3]}-${m[2]}-${m[1]}` : null;
  if (data !== dataEsperada) throw new ErroFormato(`dia.data "${dataBruta}" não é o dia pedido (${dataEsperada})`);

  const blocos = filhos(dia, 'parlamentares');
  const parlamentares = blocos.flatMap((b) => filhos(b, 'parlamentar'));
  const presencas = parlamentares.map((p, i): PresencaDia => {
    const onde = `parlamentar[${i}]`;
    const frequencia = obrigatorio(p, 'descricaoFrequenciaDia', onde, 50);
    if (!(FREQUENCIAS_DIA as readonly string[]).includes(frequencia)) {
      throw new ErroFormato(`${onde}.descricaoFrequenciaDia desconhecida: "${frequencia}"`);
    }
    const sessoes = filhos(p, 'sessoesDia').flatMap((s) => filhos(s, 'sessaoDia'));
    const justificativa = textoDe(p, 'justificativa');
    const partido = textoDe(p, 'siglaPartido');
    return {
      matricula: inteiro(p, 'carteiraParlamentar', onde, 1),
      nomeParlamentar: obrigatorio(p, 'nomeParlamentar', onde),
      siglaPartido: partido ? partido : null,
      siglaUf: uf(p, 'siglaUF', onde),
      frequencia: frequencia as FrequenciaDia,
      justificativa: justificativa ? justificativa.slice(0, 500) : null,
      sessoes: sessoes.length,
      sessoesPresente: sessoes.filter((s) => textoDe(s, 'frequencia') === 'Presença').length,
    };
  });

  const matriculas = new Set(presencas.map((p) => p.matricula));
  if (matriculas.size !== presencas.length) throw new ErroFormato('matrícula repetida no mesmo dia');
  return { data, qtdeSessoes: inteiro(dia, 'qtdeSessoesDia', 'dia', 0), presencas };
}
