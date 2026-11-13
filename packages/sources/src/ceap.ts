// SRC-01c — Cota para o Exercício da Atividade Parlamentar (CEAP), arquivo anual em CSV/ZIP.
// docs/fontes/deputado-federal.md#src-01c · MET-02
//
// Dados pessoais de terceiros NÃO saem daqui (LGPD): o CPF do deputado, o nome de
// passageiros e o nome/CPF de fornecedor pessoa física ficam só no arquivo bruto oficial.

import { ErroArquivo, linhasCsv, lerZip } from './arquivos.ts';
import { ErroFormato, UFS, type Uf } from './camara.ts';

export function urlCeapAno(ano: number): string {
  if (!Number.isSafeInteger(ano) || ano < 2008 || ano > 2100) throw new ErroFormato(`ano inválido: ${ano}`);
  return `https://www.camara.leg.br/cotas/Ano-${ano}.csv.zip`;
}

export interface DespesaCeap {
  /** = id da API v2; null em despesas de liderança (sem deputado). */
  readonly idCamara: number | null;
  readonly ano: number;
  readonly mes: number;
  readonly categoria: string;
  readonly subcota: number;
  /** null quando o fornecedor é pessoa física (não exibimos nome de particular). */
  readonly fornecedor: string | null;
  /** Só CNPJ (14 dígitos). */
  readonly cnpj: string | null;
  readonly tipoFornecedor: 'PJ' | 'PF' | 'desconhecido';
  /** AAAA-MM-DD */
  readonly dataEmissao: string | null;
  readonly valorDocumentoCentavos: number;
  readonly valorGlosaCentavos: number;
  /** O que de fato saiu da cota. Pode ser negativo (compensação de bilhete aéreo). */
  readonly valorLiquidoCentavos: number;
  readonly idDocumento: number | null;
  /** Nota fiscal digitalizada no site da Câmara. */
  readonly urlDocumento: string | null;
}

const COLUNAS = [
  'ideCadastro', 'numAno', 'numMes', 'txtDescricao', 'numSubCota', 'txtFornecedor', 'txtCNPJCPF',
  'datEmissao', 'vlrDocumento', 'vlrGlosa', 'vlrLiquido', 'ideDocumento', 'urlDocumento',
] as const;

export function centavos(valor: string, onde: string): number {
  const v = valor.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(v)) throw new ErroFormato(`${onde}: valor monetário inválido "${valor}"`);
  const negativo = v.startsWith('-');
  const [inteiros, fracao = ''] = v.replace('-', '').split('.');
  const c = Number(inteiros) * 100 + Number(fracao.padEnd(2, '0'));
  if (!Number.isSafeInteger(c)) throw new ErroFormato(`${onde}: valor fora da faixa`);
  return negativo ? -c : c;
}

function inteiroOuNulo(v: string, onde: string): number | null {
  const t = v.trim();
  if (t === '' || t === '0') return null;
  if (!/^\d+$/.test(t)) throw new ErroFormato(`${onde}: inteiro inválido "${v}"`);
  return Number(t);
}

/** Lê o ZIP anual da CEAP (bytes exatos do arquivo oficial). */
export function lerCeapZip(zip: Buffer, ano: number): DespesaCeap[] {
  let entradas: Map<string, () => Buffer>;
  try {
    entradas = lerZip(zip);
  } catch (e) {
    throw new ErroFormato(`ZIP da CEAP inválido: ${e instanceof ErroArquivo ? e.message : String(e)}`);
  }
  const extrair = entradas.get(`Ano-${ano}.csv`);
  if (!extrair) throw new ErroFormato(`ZIP sem Ano-${ano}.csv (entradas: ${[...entradas.keys()].join(', ')})`);
  return lerCeapCsv(extrair().toString('utf8'), ano);
}

export function lerCeapCsv(texto: string, ano: number): DespesaCeap[] {
  const despesas: DespesaCeap[] = [];
  let i = 0;
  try {
    for (const l of linhasCsv(texto, ';')) {
      if (i === 0) {
        const faltando = COLUNAS.filter((c) => !(c in l));
        if (faltando.length) throw new ErroFormato(`CSV da CEAP sem as colunas: ${faltando.join(', ')}`);
      }
      despesas.push(lerDespesa(l, i++, ano));
    }
  } catch (e) {
    if (e instanceof ErroFormato) throw e;
    throw new ErroFormato(`CSV da CEAP inválido: ${e instanceof Error ? e.message : String(e)}`);
  }
  return despesas;
}

function lerDespesa(l: Record<string, string>, i: number, ano: number): DespesaCeap {
  const onde = `linha ${i + 2}`;
  const anoLinha = Number(l['numAno']);
  const mes = Number(l['numMes']);
  if (anoLinha !== ano) throw new ErroFormato(`${onde}: ano ${l['numAno']} no arquivo de ${ano}`);
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new ErroFormato(`${onde}: mês inválido "${l['numMes']}"`);

  const documento = (l['txtCNPJCPF'] ?? '').replace(/\D/g, '');
  const tipoFornecedor = documento.length === 14 ? 'PJ' : documento.length === 11 ? 'PF' : 'desconhecido';
  const fornecedorBruto = (l['txtFornecedor'] ?? '').trim().slice(0, 300);

  const emissao = (l['datEmissao'] ?? '').trim();
  const dataEmissao = /^\d{4}-\d{2}-\d{2}/.test(emissao) ? emissao.slice(0, 10) : null;

  const url = (l['urlDocumento'] ?? '').trim();
  let urlDocumento: string | null = null;
  if (url) {
    const u = new URL(url);
    if (u.protocol !== 'https:' || u.hostname !== 'www.camara.leg.br') throw new ErroFormato(`${onde}: urlDocumento fora da Câmara`);
    urlDocumento = u.href;
  }

  const categoria = (l['txtDescricao'] ?? '').trim();
  if (!categoria) throw new ErroFormato(`${onde}: categoria vazia`);

  return {
    idCamara: inteiroOuNulo(l['ideCadastro']!, `${onde}.ideCadastro`),
    ano,
    mes,
    categoria: categoria.slice(0, 200),
    subcota: Number(l['numSubCota']) || 0,
    fornecedor: tipoFornecedor === 'PF' ? null : fornecedorBruto || null,
    cnpj: tipoFornecedor === 'PJ' ? documento : null,
    tipoFornecedor,
    dataEmissao,
    valorDocumentoCentavos: centavos(l['vlrDocumento']!, `${onde}.vlrDocumento`),
    // Vazio = sem glosa (acontece na complementação do auxílio-moradia).
    valorGlosaCentavos: l['vlrGlosa']!.trim() === '' ? 0 : centavos(l['vlrGlosa']!, `${onde}.vlrGlosa`),
    valorLiquidoCentavos: centavos(l['vlrLiquido']!, `${onde}.vlrLiquido`),
    idDocumento: inteiroOuNulo(l['ideDocumento']!, `${onde}.ideDocumento`),
    urlDocumento,
  };
}

// --- Teto mensal por UF ----------------------------------------------------------------

export interface TabelaTeto {
  /** AAAA-MM-DD */
  readonly vigenteDesde: string;
  readonly norma: string;
  /** Onde os valores foram lidos (conferido em 2026-11-13). */
  readonly fonte: string;
  readonly centavosPorUf: Readonly<Record<Uf, number>>;
}

const reais = (tabela: Record<Uf, string>): Record<Uf, number> =>
  Object.fromEntries(Object.entries(tabela).map(([uf, v]) => [uf, centavos(v.replace(/\./g, '').replace(',', '.'), uf)])) as Record<Uf, number>;

export const TETOS_CEAP: readonly TabelaTeto[] = [
  {
    vigenteDesde: '2023-02-01',
    norma: 'Ato da Mesa nº 270/2023 (Anexo Único do Ato da Mesa nº 43/2009)',
    fonte: 'https://www2.camara.leg.br/legin/int/atomes/2009/atodamesa-43-21-maio-2009-588364-normaatualizada-cd-mesa.html',
    centavosPorUf: reais({
      AC: '50.426,26', AL: '46.737,90', AM: '49.363,92', AP: '49.168,58', BA: '44.804,65', CE: '48.245,57',
      DF: '36.582,46', ES: '43.217,71', GO: '41.300,86', MA: '47.945,49', MG: '41.886,51', MS: '46.336,64',
      MT: '45.221,83', PA: '48.021,25', PB: '47.826,36', PE: '47.470,60', PI: '46.765,57', PR: '44.665,66',
      RJ: '41.553,77', RN: '48.525,79', RO: '49.466,29', RR: '51.406,33', RS: '46.669,70', SC: '45.671,58',
      SE: '45.933,06', SP: '42.837,33', TO: '45.297,41',
    }),
  },
  {
    // O Ato 244/2026 não publica a tabela; os valores são os divulgados pela Câmara.
    // Conferência: razão de 1,1375 sobre a tabela anterior em todas as UFs (IPCA citado no ato).
    vigenteDesde: '2026-02-20',
    norma: 'Ato da Mesa nº 244/2026 (atualização pelo IPCA de fev/2023 a dez/2025)',
    fonte: 'https://www2.camara.leg.br/comunicacao/assessoria-de-imprensa/guia-para-jornalistas/cota-parlamentar',
    centavosPorUf: reais({
      AC: '57.359,87', AL: '53.164,36', AM: '56.151,46', AP: '55.929,26', BA: '50.965,29', CE: '54.879,34',
      DF: '41.612,55', ES: '49.160,15', GO: '46.979,73', MA: '54.537,99', MG: '47.645,91', MS: '52.707,93',
      MT: '51.439,83', PA: '54.624,17', PB: '54.402,48', PE: '53.997,81', PI: '53.195,84', PR: '50.807,19',
      RJ: '47.267,41', RN: '55.198,09', RO: '56.267,90', RR: '58.474,70', RS: '53.086,78', SC: '51.951,42',
      SE: '52.248,86', SP: '48.727,46', TO: '51.525,80',
    }),
  },
];

/**
 * Teto do mês: o da tabela vigente no 1º dia do mês. (O Ato 244/2026 vigora desde 20/02/2026;
 * fevereiro de 2026 fica com o teto anterior, que é o vigente na maior parte do mês.)
 */
export function tetoCeap(uf: Uf, ano: number, mes: number): { centavos: number; tabela: TabelaTeto } | null {
  const primeiroDia = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const tabela = [...TETOS_CEAP].reverse().find((t) => t.vigenteDesde <= primeiroDia);
  return tabela ? { centavos: tabela.centavosPorUf[uf], tabela } : null;
}

/** Garante que toda tabela tem as 27 UFs (falha no carregamento do módulo se não tiver). */
for (const t of TETOS_CEAP) {
  for (const uf of UFS) {
    if (!(t.centavosPorUf[uf] > 0)) throw new Error(`TETOS_CEAP ${t.vigenteDesde}: sem valor para ${uf}`);
  }
}
