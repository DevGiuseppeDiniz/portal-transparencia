// Cálculo da MET-01 (docs/04-metricas.md#met-01) a partir do core, gravado em metrics com
// o registro do cálculo: método, período e todas as coletas usadas (DEC-10).
// A conta em si é feita por @portal/metrics (função pura e testada); aqui só há I/O.

import type { Sql } from '@portal/db';
import {
  MET01_MIN_DIAS_REFERENCIA,
  MET01_VERSAO,
  calcularPresenca,
  referenciaPresenca,
  type FrequenciaDia,
} from '@portal/metrics';
import { LEGISLATURA_ATUAL } from '@portal/sources';
import { fatiar } from '../coleta.ts';

export interface ResultadoCalculo {
  readonly calculoId: string;
  readonly deputados: number;
  readonly periodo: { readonly inicio: string; readonly fim: string };
  readonly referencia: { readonly n: number; readonly mediana: number; readonly p25: number; readonly p75: number } | null;
}

export async function calcularMet01(sql: Sql, versaoCalculo: string): Promise<ResultadoCalculo | null> {
  const linhas = await sql<{ id_camara: number; frequencia: FrequenciaDia | null; data: string | null; coleta_id: string | null }[]>`
    select d.id_camara, p.frequencia, to_char(p.data, 'YYYY-MM-DD') as data, p.coleta_id
      from core.deputado d
      left join core.deputado_matricula m on m.id_camara = d.id_camara
      left join core.presenca_dia p on p.matricula = m.matricula and p.data >= ${LEGISLATURA_ATUAL.inicio}::date
     where d.em_exercicio`;
  if (linhas.length === 0) return null;

  const porDeputado = new Map<number, FrequenciaDia[]>();
  const coletas = new Set<string>();
  let fim = LEGISLATURA_ATUAL.inicio as string;
  for (const l of linhas) {
    if (!porDeputado.has(l.id_camara)) porDeputado.set(l.id_camara, []);
    if (l.frequencia && l.data && l.coleta_id) {
      porDeputado.get(l.id_camara)!.push(l.frequencia);
      coletas.add(l.coleta_id);
      if (l.data > fim) fim = l.data;
    }
  }
  if (coletas.size === 0) return null;

  // As coletas da lista de deputados e das matrículas também sustentam o número.
  const apoio = await sql<{ coleta_id: string }[]>`
    select distinct coleta_id from core.deputado where em_exercicio
    union select distinct coleta_id from core.deputado_matricula`;
  for (const a of apoio) coletas.add(a.coleta_id);

  const resultados = [...porDeputado].map(([id, freqs]) => ({ id, r: calcularPresenca(freqs) }));
  const referencia = referenciaPresenca(resultados.map((x) => x.r));

  return sql.begin(async (tx) => {
    const [calculo] = await tx<{ id: string }[]>`
      insert into metrics.calculo (metrica, versao_metodo, periodo_inicio, periodo_fim, coleta_ids, versao_calculo)
      values ('MET-01', ${MET01_VERSAO}, ${LEGISLATURA_ATUAL.inicio}, ${fim}, ${[...coletas]}::uuid[], ${versaoCalculo})
      returning id`;
    const calculoId = calculo!.id;
    for (const lote of fatiar(resultados, 300)) {
      await tx`insert into metrics.met01_presenca ${tx(
        lote.map(({ id, r }) => ({
          calculo_id: calculoId,
          id_camara: id,
          dias: r.dias,
          presencas: r.presencas,
          presencas_sem_registro_na_sessao: r.presencasSemRegistroNaSessao,
          ausencias_justificadas: r.ausenciasJustificadas,
          ausencias_nao_justificadas: r.ausenciasNaoJustificadas,
          taxa_presenca: r.taxaPresenca,
          entra_na_referencia: r.dias >= MET01_MIN_DIAS_REFERENCIA,
        })),
      )}`;
    }
    if (referencia) {
      await tx`
        insert into metrics.met01_referencia (calculo_id, n, mediana, p25, p75, minimo, maximo, min_dias)
        values (${calculoId}, ${referencia.n}, ${referencia.mediana}, ${referencia.p25}, ${referencia.p75},
                ${referencia.minimo}, ${referencia.maximo}, ${MET01_MIN_DIAS_REFERENCIA})`;
    }
    return {
      calculoId,
      deputados: resultados.length,
      periodo: { inicio: LEGISLATURA_ATUAL.inicio, fim },
      referencia: referencia && { n: referencia.n, mediana: referencia.mediana, p25: referencia.p25, p75: referencia.p75 },
    };
  });
}
