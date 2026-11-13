// Tipos do banco. Espelham migrations/0001_proveniencia.sql (DEC-10).
// O driver e o query builder ainda não foram escolhidos (10-pendencias). Este pacote é
// importado só pelo apps/ingest e por código de servidor: componente cliente que o
// importe é bloqueado pela barreira 3b.

import type { FonteId } from '@portal/sources';

export type StatusColeta = 'em_andamento' | 'sucesso' | 'parcial' | 'falha';
export type MetodoColeta = 'api' | 'arquivo';

/** Uma execução de coletor. Append-only. */
export interface Coleta {
  readonly id: string;
  readonly fonteId: FonteId;
  /** URL exata requisitada, sem chave de API. */
  readonly urlRequisitada: string;
  readonly metodo: MetodoColeta;
  readonly iniciadaEm: Date;
  readonly finalizadaEm: Date | null;
  readonly statusHttp: number | null;
  readonly status: StatusColeta;
  /** SHA-256 do payload bruto, em hexadecimal. */
  readonly hashConteudo: string | null;
  /** Onde o payload bruto está guardado (armazenamento de objetos). */
  readonly caminhoRaw: string | null;
  /** Commit/versão do código que coletou. */
  readonly versaoColetor: string;
  readonly registros: number | null;
  readonly erro: string | null;
}

/** Campos obrigatórios em todo registro de staging, core e metrics. */
export interface Proveniencia {
  readonly coletaId: string;
  readonly fonteId: FonteId;
  readonly obtidoEm: Date;
  /** Link que qualquer pessoa pode abrir para conferir o dado na fonte oficial. */
  readonly urlOrigemPublica: string;
}

/** Campos adicionais de proveniência em métricas calculadas. */
export interface ProvenienciaMetrica extends Omit<Proveniencia, 'coletaId'> {
  readonly versaoMetodo: string;
  readonly coletaIds: readonly string[];
}
