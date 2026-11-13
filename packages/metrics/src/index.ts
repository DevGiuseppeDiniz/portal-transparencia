// Cálculo das métricas (docs/04-metricas.md). Funções puras: recebem dados já
// normalizados e devolvem o valor + a referência de comparação (PRI-02). Sem I/O.

/** Mediana de uma lista de números. Lista vazia devolve null (dado faltante ≠ zero, DSG-10). */
export function mediana(valores: readonly number[]): number | null {
  return quantil(valores, 0.5);
}

/**
 * Quantil por interpolação linear entre os pontos ordenados (Hyndman & Fan tipo 7, o
 * padrão do R e do NumPy), para que qualquer auditor reproduza o número com ferramenta comum.
 */
export function quantil(valores: readonly number[], p: number): number | null {
  if (!(p >= 0 && p <= 1)) throw new RangeError(`quantil fora de [0, 1]: ${p}`);
  if (valores.length === 0) return null;
  if (valores.some((v) => !Number.isFinite(v))) throw new RangeError('valores precisam ser finitos');
  const ordenados = [...valores].sort((a, b) => a - b);
  const posicao = (ordenados.length - 1) * p;
  const baixo = Math.floor(posicao);
  const fracao = posicao - baixo;
  const a = ordenados[baixo]!;
  const b = ordenados[Math.min(baixo + 1, ordenados.length - 1)]!;
  return a + (b - a) * fracao;
}

/** Referência de comparação: mediana e faixa interquartil (PRI-02). */
export interface Distribuicao {
  readonly n: number;
  readonly media: number;
  readonly mediana: number;
  readonly p25: number;
  readonly p75: number;
  readonly minimo: number;
  readonly maximo: number;
}

export function distribuicao(valores: readonly number[]): Distribuicao | null {
  if (valores.length === 0) return null;
  return {
    n: valores.length,
    media: valores.reduce((a, b) => a + b, 0) / valores.length,
    mediana: quantil(valores, 0.5)!,
    p25: quantil(valores, 0.25)!,
    p75: quantil(valores, 0.75)!,
    minimo: Math.min(...valores),
    maximo: Math.max(...valores),
  };
}

// --- MET-01: presença em sessões deliberativas -----------------------------------------

/** Muda sempre que o método mudar; fica gravado junto de cada número (DEC-10). */
export const MET01_VERSAO = 'met01-v1';
/**
 * Mínimo de dias de sessão para entrar na referência da Câmara. Quem tem poucos dias
 * (suplente que assumiu há pouco) aparece com o próprio número, mas não distorce a mediana.
 */
export const MET01_MIN_DIAS_REFERENCIA = 30;

export type FrequenciaDia = 'Presença' | 'Presença (~)' | 'Ausência' | 'Ausência justificada';

export interface PresencaCalculada {
  /** Dias com sessão deliberativa em que o deputado estava em exercício. */
  readonly dias: number;
  readonly presencas: number;
  /**
   * "Presença (~)": presença consolidada no dia com ausência na ata da sessão. Pelo Ato da
   * Mesa 191/2017 (art. 2º, parágrafo único) a ata prevalece: não conta como presença.
   */
  readonly presencasSemRegistroNaSessao: number;
  readonly ausenciasJustificadas: number;
  readonly ausenciasNaoJustificadas: number;
  /** presenças ÷ dias; null sem dias (dado faltante, DSG-10). */
  readonly taxaPresenca: number | null;
}

/**
 * MET-01. Unidade: o dia com sessão deliberativa, como a Câmara registra a frequência
 * oficial. Ausência justificada é ausência: não entra como presença, é exibida à parte.
 */
export function calcularPresenca(frequencias: readonly FrequenciaDia[]): PresencaCalculada {
  let presencas = 0;
  let presencasSemRegistroNaSessao = 0;
  let ausenciasJustificadas = 0;
  let ausenciasNaoJustificadas = 0;
  for (const f of frequencias) {
    if (f === 'Presença') presencas++;
    else if (f === 'Presença (~)') presencasSemRegistroNaSessao++;
    else if (f === 'Ausência justificada') ausenciasJustificadas++;
    else if (f === 'Ausência') ausenciasNaoJustificadas++;
    else throw new RangeError(`frequência desconhecida: ${String(f)}`);
  }
  const dias = frequencias.length;
  return {
    dias,
    presencas,
    presencasSemRegistroNaSessao,
    ausenciasJustificadas,
    ausenciasNaoJustificadas,
    taxaPresenca: dias ? presencas / dias : null,
  };
}

/** Referência da Câmara: só deputados com dias suficientes (MET01_MIN_DIAS_REFERENCIA). */
export function referenciaPresenca(resultados: readonly PresencaCalculada[]): Distribuicao | null {
  return distribuicao(
    resultados
      .filter((r) => r.dias >= MET01_MIN_DIAS_REFERENCIA && r.taxaPresenca !== null)
      .map((r) => r.taxaPresenca!),
  );
}

// --- MET-02: uso da cota parlamentar (CEAP) --------------------------------------------

export const MET02_VERSAO = 'met02-v1';
/** Prazo para o deputado apresentar a nota (Câmara, "Guia para jornalistas"): mês mais recente que isso está incompleto. */
export const MET02_PRAZO_DIAS = 90;
/** Mínimo de meses em exercício no período para entrar na referência da UF. */
export const MET02_MIN_MESES_REFERENCIA = 6;
export const MET02_FORNECEDORES_EXIBIDOS = 10;

/** 'AAAA-MM' */
export type Mes = string;

function somarMeses(mes: Mes, n: number): Mes {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/**
 * Os 12 meses fechados mais recentes cujo prazo de apresentação de notas já acabou: o
 * último mês do período terminou há mais de MET02_PRAZO_DIAS dias.
 */
export function periodoCeap(hoje: Date): { readonly meses: readonly Mes[]; readonly inicio: Mes; readonly fim: Mes } {
  const limite = new Date(hoje.getTime() - MET02_PRAZO_DIAS * 86_400_000);
  const fim = somarMeses(limite.toISOString().slice(0, 7), -1);
  const meses = Array.from({ length: 12 }, (_, i) => somarMeses(fim, i - 11));
  return { meses, inicio: meses[0]!, fim };
}

export interface MudancaSituacao {
  /** 'AAAA-MM-DDTHH:MM' (horário de Brasília, como a Câmara publica). */
  readonly dataHora: string;
  /** "Exercício", "Licença", "Suplência"…; null = registro que não muda a situação. */
  readonly situacao: string | null;
}

/** Meses do período em que o deputado esteve em exercício em pelo menos um momento. */
export function mesesEmExercicio(historico: readonly MudancaSituacao[], meses: readonly Mes[]): Mes[] {
  const intervalos: Array<[string, string]> = [];
  let inicio: string | null = null;
  for (const h of [...historico].filter((h) => h.situacao !== null).sort((a, b) => a.dataHora.localeCompare(b.dataHora))) {
    if (h.situacao === 'Exercício') inicio ??= h.dataHora;
    else if (inicio !== null) {
      intervalos.push([inicio, h.dataHora]);
      inicio = null;
    }
  }
  if (inicio !== null) intervalos.push([inicio, '9999-12-31T23:59']);
  return meses.filter((m) => {
    const de = `${m}-01T00:00`;
    const ate = `${somarMeses(m, 1)}-01T00:00`;
    return intervalos.some(([a, b]) => a < ate && b > de);
  });
}

export interface DespesaCota {
  readonly mes: Mes;
  readonly categoria: string;
  readonly fornecedor: string | null;
  readonly cnpj: string | null;
  readonly tipoFornecedor: 'PJ' | 'PF' | 'desconhecido';
  readonly centavos: number;
  /** Quantos documentos esta linha representa (quando já vem agregada); padrão 1. */
  readonly documentos?: number;
}

export interface FornecedorCota {
  /** "Pessoa física" quando o fornecedor é particular (nome não é exibido). */
  readonly fornecedor: string;
  readonly cnpj: string | null;
  readonly centavos: number;
  readonly documentos: number;
}

export interface CotaCalculada {
  readonly mesesEmExercicio: number;
  readonly gastoCentavos: number;
  readonly tetoCentavos: number;
  /** gasto ÷ soma dos tetos dos meses em exercício; null sem meses (DSG-10). */
  readonly percentualTeto: number | null;
  readonly porCategoria: ReadonlyArray<{ readonly categoria: string; readonly centavos: number }>;
  readonly fornecedores: readonly FornecedorCota[];
  /** Parcela do gasto nos 3 maiores fornecedores (sinal auditável, sem rótulo; MET-02). */
  readonly concentracaoTop3: number | null;
  readonly totalFornecedores: number;
}

/**
 * MET-02. Só entram despesas dos meses em que o deputado estava em exercício, e o teto é a
 * soma do teto de cada um desses meses (o teto muda com a UF e com a norma vigente).
 */
export function calcularCota(
  despesas: readonly DespesaCota[],
  meses: readonly Mes[],
  tetoDoMes: (mes: Mes) => number,
): CotaCalculada {
  const noPeriodo = new Set(meses);
  const consideradas = despesas.filter((d) => noPeriodo.has(d.mes));
  const gasto = consideradas.reduce((t, d) => t + d.centavos, 0);
  const teto = meses.reduce((t, m) => t + tetoDoMes(m), 0);

  const categorias = new Map<string, number>();
  const fornecedores = new Map<string, { fornecedor: string; cnpj: string | null; centavos: number; documentos: number }>();
  for (const d of consideradas) {
    categorias.set(d.categoria, (categorias.get(d.categoria) ?? 0) + d.centavos);
    const nome = d.tipoFornecedor === 'PF' ? 'Pessoa física' : (d.fornecedor ?? 'Não informado');
    const chave = d.cnpj ?? `${d.tipoFornecedor}:${nome}`;
    const f = fornecedores.get(chave) ?? { fornecedor: nome, cnpj: d.cnpj, centavos: 0, documentos: 0 };
    f.centavos += d.centavos;
    f.documentos += d.documentos ?? 1;
    fornecedores.set(chave, f);
  }
  const ordenados = [...fornecedores.values()].sort((a, b) => b.centavos - a.centavos);
  const top3 = ordenados.slice(0, 3).reduce((t, f) => t + f.centavos, 0);

  return {
    mesesEmExercicio: meses.length,
    gastoCentavos: gasto,
    tetoCentavos: teto,
    percentualTeto: teto > 0 ? gasto / teto : null,
    porCategoria: [...categorias].map(([categoria, centavos]) => ({ categoria, centavos })).sort((a, b) => b.centavos - a.centavos),
    fornecedores: ordenados.slice(0, MET02_FORNECEDORES_EXIBIDOS),
    concentracaoTop3: gasto > 0 ? top3 / gasto : null,
    totalFornecedores: ordenados.length,
  };
}

/** Referência por UF (PRI-03): só deputados com meses suficientes em exercício. */
export function referenciaCotaPorUf(
  resultados: ReadonlyArray<{ readonly uf: string; readonly cota: CotaCalculada }>,
): Map<string, Distribuicao> {
  const porUf = new Map<string, number[]>();
  for (const { uf, cota } of resultados) {
    if (cota.mesesEmExercicio < MET02_MIN_MESES_REFERENCIA || cota.percentualTeto === null) continue;
    porUf.set(uf, [...(porUf.get(uf) ?? []), cota.percentualTeto]);
  }
  return new Map([...porUf].map(([uf, valores]) => [uf, distribuicao(valores)!]));
}

// --- MET-03: funil legislativo ---------------------------------------------------------
// Estágios adaptados de REF-05 (Volden & Wiseman) ao rito da Câmara. Funil descritivo:
// sem pesos e sem índice (PRI-01, DEC-01). Vocabulário conferido nos arquivos de
// tramitação 2023–2026 (docs/04-metricas.md#met-03).

export const MET03_VERSAO = 'met03-v1';
/** Mínimo de projetos apresentados para a taxa "virou lei ÷ apresentados" entrar na referência. */
export const MET03_MIN_APRESENTADAS_TAXA = 5;

export const ESTAGIOS_FUNIL = ['apresentada', 'comissao', 'alem_comissao', 'aprovada_camara', 'lei'] as const;
export type EstagioFunil = (typeof ESTAGIOS_FUNIL)[number];

/** Parecer de relator: em comissão é o estágio 2; no Plenário, o 3. */
const PARECER = new Set([
  'Parecer do(a) Relator(a)',
  'Saída de Relator(a) da Comissão - Com Parecer Apresentado',
  'Aprovação do Parecer',
  'Leitura e publicação do Parecer',
  'Rejeição do Parecer do(a) Relator(a)',
  'Ratificação de Parecer',
  'Análise Parecer',
  'Aprovação do Relatório Prévio ou Parcial',
]);
const ACAO_PLENARIO = new Set([
  'Votação',
  'Votação (Plenário)',
  'Discussão (Plenário)',
  'Discussão da Materia pelos(as) Deputados(as)',
  'Encaminhamento da Votação',
  'Encaminhamento (Plenário)',
  'Aprovação de Urgência (154, 155 ou 64 CF)',
  'Aprovação de Proposição (Plenário)',
  'Rejeição de Proposição (Plenário)',
  'Destaques (Plenário)',
  'Obstrução Discussão (Plenário)',
  'Obstruçao Votação (Plenário)',
  'Verificação de Votação',
  'Verificação de Votação (Plenário)',
  'Manutenção do texto (Plenário)',
  'Prejudicialidade (Plenário)',
]);
const APROVADA_TRAMITACAO = new Set(['Remessa ao Senado Federal', 'Remessa à Sanção', 'Remessa à Promulgação', 'Aprovação da Redação Final']);
const APROVADA_SITUACAO = new Set([
  'Aguardando Apreciação pelo Senado Federal',
  'Aguardando Sanção',
  'Aguardando Autógrafos na Mesa',
  'Aguardando Promulgação',
  'Aguardando Apreciação do Veto',
  'Aguardando Envio à Redação Final',
  'Aguardando Redação Final',
]);
const LEI_TRAMITACAO: ReadonlySet<string> = new Set(['Transformação em Norma Jurídica', 'Transformado em Norma Jurídica com Veto Parcial']);

export interface TramitacaoFunil {
  readonly siglaOrgao: string;
  readonly descricao: string;
}

export interface ProposicaoFunil {
  readonly siglaTipo: 'PL' | 'PLP' | 'PEC';
  /** Situação atual (ultimoStatus). */
  readonly situacao: string | null;
  readonly apensadaA: number | null;
  readonly tramitacoes: readonly TramitacaoFunil[];
}

export interface ClassificacaoProposicao {
  /** Estágio mais avançado alcançado (os anteriores contam como alcançados). */
  readonly estagio: EstagioFunil;
  /** Está tramitando em conjunto com outra (apensada): o conteúdo pode seguir no principal. */
  readonly apensada: boolean;
  readonly encerrada: 'arquivada' | 'retirada' | 'devolvida' | null;
}

export function classificarProposicao(p: ProposicaoFunil): ClassificacaoProposicao {
  const situacao = p.situacao ?? '';
  let n = 1;
  for (const t of p.tramitacoes) {
    const plenario = t.siglaOrgao === 'PLEN';
    if (LEI_TRAMITACAO.has(t.descricao)) n = Math.max(n, 5);
    else if (APROVADA_TRAMITACAO.has(t.descricao) || (t.descricao === 'Aprovação de Proposição (Plenário)' && p.siglaTipo !== 'PEC')) n = Math.max(n, 4);
    else if (plenario && (ACAO_PLENARIO.has(t.descricao) || PARECER.has(t.descricao))) n = Math.max(n, 3);
    else if (!plenario && PARECER.has(t.descricao)) n = Math.max(n, 2);
  }
  if (situacao.startsWith('Transformado em Norma Jurídica')) n = 5;
  else if (APROVADA_SITUACAO.has(situacao)) n = Math.max(n, 4);

  return {
    estagio: ESTAGIOS_FUNIL[n - 1]!,
    apensada: situacao === 'Tramitando em Conjunto' || p.apensadaA !== null,
    encerrada:
      situacao === 'Arquivada' ? 'arquivada'
      : situacao.startsWith('Retirado pelo') ? 'retirada'
      : situacao.startsWith('Devolvida ao') ? 'devolvida'
      : null,
  };
}

export interface FunilCalculado {
  /** Quantos chegaram PELO MENOS a cada estágio. */
  readonly porEstagio: Readonly<Record<EstagioFunil, number>>;
  /**
   * Tramitando em conjunto com outro projeto: o conteúdo pode seguir no principal (REF-29).
   * Mostradas à parte, nunca como "paradas".
   */
  readonly apensadas: number;
  readonly arquivadas: number;
  readonly retiradas: number;
  readonly devolvidas: number;
  /** leis ÷ apresentadas; null sem projetos. */
  readonly taxaLei: number | null;
}

export function calcularFunil(itens: readonly ClassificacaoProposicao[]): FunilCalculado {
  const porEstagio = Object.fromEntries(ESTAGIOS_FUNIL.map((e) => [e, 0])) as Record<EstagioFunil, number>;
  let apensadas = 0;
  const encerradas = { arquivada: 0, retirada: 0, devolvida: 0 };
  for (const c of itens) {
    const ate = ESTAGIOS_FUNIL.indexOf(c.estagio);
    for (let i = 0; i <= ate; i++) porEstagio[ESTAGIOS_FUNIL[i]!]++;
    if (c.apensada) apensadas++;
    if (c.encerrada) encerradas[c.encerrada]++;
  }
  return {
    porEstagio,
    apensadas,
    arquivadas: encerradas.arquivada,
    retiradas: encerradas.retirada,
    devolvidas: encerradas.devolvida,
    taxaLei: itens.length ? porEstagio.lei / itens.length : null,
  };
}

/** Referência da Câmara: distribuição de cada estágio e da taxa de lei (PRI-02). */
export function referenciaFunil(funis: readonly FunilCalculado[]): {
  readonly porEstagio: Readonly<Record<EstagioFunil, Distribuicao | null>>;
  readonly taxaLei: Distribuicao | null;
} {
  return {
    porEstagio: Object.fromEntries(ESTAGIOS_FUNIL.map((e) => [e, distribuicao(funis.map((f) => f.porEstagio[e]))])) as Record<EstagioFunil, Distribuicao | null>,
    taxaLei: distribuicao(
      funis.filter((f) => f.porEstagio.apresentada >= MET03_MIN_APRESENTADAS_TAXA && f.taxaLei !== null).map((f) => f.taxaLei!),
    ),
  };
}
