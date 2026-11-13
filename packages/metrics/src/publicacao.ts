// Contrato do snapshot publicado (apps/ingest `publicar` → apps/web). O site público lê só
// estes JSON: não tem acesso ao banco (DEC-12, SEG-01). Toda métrica leva a proveniência
// (DEC-10): cálculo, método, período, fontes e data da coleta mais recente usada.

import type { Distribuicao, EstagioFunil, FrequenciaDia } from './index.ts';

export const VERSAO_PUBLICACAO = 1;

/** Distribuição publicada: a média pode não existir (a MET-01 usa só mediana e quartis). */
export type DistribuicaoPublicada = Omit<Distribuicao, 'media'> & { readonly media: number | null };

export interface FontePublicada {
  readonly id: string;
  readonly nome: string;
  /** Página ou arquivo oficial onde qualquer pessoa confere o dado. */
  readonly url: string;
}

export interface ProvenienciaPublicada {
  readonly calculoId: string;
  readonly metrica: 'MET-01' | 'MET-02' | 'MET-03';
  readonly versaoMetodo: string;
  readonly periodo: { readonly inicio: string; readonly fim: string };
  readonly calculadoEm: string;
  /** Quantas coletas (raw.coleta) sustentam o número. */
  readonly coletas: number;
  /** Data da coleta mais recente usada (ISO). */
  readonly ultimaColeta: string;
  readonly fontes: readonly FontePublicada[];
}

/** Quantos da referência têm valor menor, igual e o total (para "X em cada 10"). */
export interface PosicaoRelativa {
  readonly menores: number;
  readonly iguais: number;
  readonly total: number;
}

export interface ResumoDeputado {
  readonly id: number;
  readonly nome: string;
  readonly partido: string | null;
  readonly uf: string;
  readonly urlFoto: string | null;
  /** Página do deputado no site da Câmara. */
  readonly urlCamara: string;
}

export interface PresencaPublicada {
  readonly dias: number;
  readonly presencas: number;
  readonly presencasSemRegistroNaSessao: number;
  readonly ausenciasJustificadas: number;
  readonly ausenciasNaoJustificadas: number;
  readonly taxa: number | null;
  readonly entraNaReferencia: boolean;
  readonly minDiasReferencia: number;
  readonly referencia: DistribuicaoPublicada | null;
  /** Taxa de cada deputado da referência: o gráfico mostra a distribuição inteira, não só a mediana. */
  readonly valoresReferencia: readonly number[];
  readonly posicao: PosicaoRelativa | null;
  /** Motivos das ausências justificadas, com quantos dias cada. */
  readonly justificativas: ReadonlyArray<{ readonly motivo: string; readonly dias: number }>;
  /** O dado bruto da conta: cada dia de sessão. */
  readonly diasDeSessao: ReadonlyArray<{ readonly data: string; readonly frequencia: FrequenciaDia; readonly justificativa: string | null }>;
  /** URL oficial da frequência de um dia: troque {DD}, {MM} e {AAAA} pela data. */
  readonly urlModeloDia: string;
  readonly proveniencia: ProvenienciaPublicada;
}

export interface CotaPublicada {
  readonly mesesEmExercicio: number;
  readonly gastoCentavos: number;
  readonly valorBaseCentavos: number;
  readonly percentual: number | null;
  readonly entraNaReferencia: boolean;
  readonly minMesesReferencia: number;
  /** Referência: deputados do mesmo estado (PRI-03). */
  readonly referenciaUf: DistribuicaoPublicada | null;
  readonly valoresReferenciaUf: readonly number[];
  readonly posicaoUf: PosicaoRelativa | null;
  readonly categorias: ReadonlyArray<{ readonly categoria: string; readonly centavos: number }>;
  readonly fornecedores: ReadonlyArray<{ readonly fornecedor: string; readonly cnpj: string | null; readonly centavos: number; readonly documentos: number }>;
  readonly concentracaoTop3: number | null;
  readonly totalFornecedores: number;
  /** Gasto e valor-base de cada mês do período (gráfico mensal). */
  readonly porMes: ReadonlyArray<{ readonly mes: string; readonly emExercicio: boolean; readonly gastoCentavos: number; readonly valorBaseCentavos: number }>;
  /** Valor-base de cada mês do período, com a norma que o fixou. */
  readonly valoresBase: ReadonlyArray<{ readonly mes: string; readonly centavos: number; readonly norma: string; readonly fonte: string }>;
  readonly proveniencia: ProvenienciaPublicada;
}

export interface ProjetoPublicado {
  readonly id: number;
  readonly sigla: string;
  readonly numero: number;
  readonly ano: number;
  readonly ementa: string;
  readonly apresentadoEm: string;
  readonly estagio: EstagioFunil;
  readonly apensado: boolean;
  readonly encerrado: 'arquivada' | 'retirada' | 'devolvida' | null;
  readonly situacao: string | null;
  readonly url: string;
}

export interface ProjetosPublicados {
  readonly porEstagio: Readonly<Record<EstagioFunil, number>>;
  readonly apensados: number;
  readonly arquivados: number;
  readonly retirados: number;
  readonly devolvidos: number;
  readonly taxaLei: number | null;
  readonly referencia: {
    readonly porEstagio: Readonly<Record<EstagioFunil, DistribuicaoPublicada | null>>;
    readonly taxaLei: DistribuicaoPublicada | null;
    /** Quantos deputados em exercício tiveram ao menos um projeto próprio transformado em lei. */
    readonly deputadosComLei: number;
    readonly totalDeputados: number;
  };
  readonly lista: readonly ProjetoPublicado[];
  readonly proveniencia: ProvenienciaPublicada;
}

export interface DeputadoPublicado {
  readonly versao: typeof VERSAO_PUBLICACAO;
  readonly geradoEm: string;
  readonly deputado: ResumoDeputado & { readonly email: string | null; readonly obtidoEm: string };
  /** null = sem cálculo publicado para esta métrica (DSG-10: faltante, nunca zero). */
  readonly presenca: PresencaPublicada | null;
  readonly cota: CotaPublicada | null;
  readonly projetos: ProjetosPublicados | null;
}

export interface IndicePublicado {
  readonly versao: typeof VERSAO_PUBLICACAO;
  readonly geradoEm: string;
  /** Deputados em exercício, em ordem alfabética (nunca por métrica: sem ranking, DEC-01). */
  readonly deputados: readonly ResumoDeputado[];
  /** SHA-256 de cada arquivo publicado, para quem quiser conferir a integridade. */
  readonly arquivos: Readonly<Record<string, string>>;
}

/** Posição de `valor` entre `valores` (quantos são menores e iguais). */
export function posicaoRelativa(valor: number | null, valores: readonly number[]): PosicaoRelativa | null {
  if (valor === null || valores.length === 0) return null;
  let menores = 0;
  let iguais = 0;
  for (const v of valores) {
    if (v < valor) menores++;
    else if (v === valor) iguais++;
  }
  return { menores, iguais, total: valores.length };
}

/** Um deputado na referência de uma métrica: para mostrar quem é cada ponto do gráfico de posição. */
export interface PontoReferencia {
  readonly id: number;
  readonly nome: string;
  readonly partido: string | null;
  readonly uf: string;
  readonly valor: number;
}

/** Arquivo compartilhado (`referencias.json`), baixado pelo navegador só quando o gráfico é explorado. */
export interface ReferenciasPublicadas {
  readonly versao: typeof VERSAO_PUBLICACAO;
  readonly geradoEm: string;
  /** Presença dos deputados que entram na referência da Câmara, em ordem de valor. */
  readonly presenca: readonly PontoReferencia[];
  /** Uso da cota por UF (a comparação é dentro do estado), em ordem de valor. */
  readonly cotaPorUf: Readonly<Record<string, readonly PontoReferencia[]>>;
}
