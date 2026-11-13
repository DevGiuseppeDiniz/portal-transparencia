// Cálculo da MET-02 (docs/04-metricas.md#met-02): gasto da CEAP ÷ teto dos meses em
// exercício, por deputado, com referência por UF. A conta é de @portal/metrics.

import type { Sql } from '@portal/db';
import {
  MET02_MIN_MESES_REFERENCIA,
  MET02_VERSAO,
  calcularCota,
  mesesEmExercicio,
  periodoCeap,
  referenciaCotaPorUf,
  type CotaCalculada,
  type DespesaCota,
  type MudancaSituacao,
} from '@portal/metrics';
import { tetoCeap, type Uf } from '@portal/sources';
import { fatiar } from '../coleta.ts';
import { CHAVE_HISTORICO, chaveCeap } from '../coletores/ceap.ts';

export interface ResultadoMet02 {
  readonly calculoId: string;
  readonly deputados: number;
  readonly periodo: { readonly inicio: string; readonly fim: string };
  readonly ufsComReferencia: number;
}

export async function calcularMet02(sql: Sql, versaoCalculo: string, hoje = new Date()): Promise<ResultadoMet02 | null> {
  const periodo = periodoCeap(hoje);
  const anos = [...new Set(periodo.meses.map((m) => Number(m.slice(0, 4))))];
  const chaves = [...anos.map(chaveCeap), CHAVE_HISTORICO];

  const vigentes = await sql<{ chave: string; coleta_id: string }[]>`
    select chave, coleta_id from core.coleta_vigente where chave in ${sql(chaves)}`;
  const faltando = chaves.filter((c) => !vigentes.some((v) => v.chave === c));
  if (faltando.length) {
    throw new Error(`MET-02 sem coleta vigente para: ${faltando.join(', ')} (rode as etapas ceap e historico)`);
  }
  const coletaCeap = vigentes.filter((v) => v.chave.startsWith('ceap:')).map((v) => v.coleta_id);
  const coletaHistorico = vigentes.find((v) => v.chave === CHAVE_HISTORICO)!.coleta_id;

  const deputados = await sql<{ id_camara: number; sigla_uf: Uf; coleta_id: string }[]>`
    select id_camara, sigla_uf, coleta_id from core.deputado where em_exercicio`;
  if (deputados.length === 0) return null;

  const historicos = new Map<number, MudancaSituacao[]>();
  for (const h of await sql<{ id_camara: number; data_hora: string; situacao: string | null }[]>`
      select id_camara, to_char(data_hora, 'YYYY-MM-DD"T"HH24:MI') as data_hora, situacao
        from staging.camara_historico where coleta_id = ${coletaHistorico}`) {
    historicos.set(h.id_camara, [...(historicos.get(h.id_camara) ?? []), { dataHora: h.data_hora, situacao: h.situacao }]);
  }

  // Agregado no banco: por deputado, mês, categoria e fornecedor.
  const despesas = new Map<number, DespesaCota[]>();
  for (const d of await sql<{
    id_camara: number; mes: string; categoria: string; fornecedor: string | null; cnpj: string | null;
    tipo_fornecedor: DespesaCota['tipoFornecedor']; centavos: string; documentos: number;
  }[]>`
      select id_camara, to_char(make_date(ano, mes, 1), 'YYYY-MM') as mes, categoria, fornecedor, cnpj,
             tipo_fornecedor, sum(valor_liquido)::text as centavos, count(*)::int as documentos
        from staging.camara_despesa
       where coleta_id in ${sql(coletaCeap)}
         and id_camara is not null
         and make_date(ano, mes, 1) between ${`${periodo.inicio}-01`}::date and ${`${periodo.fim}-01`}::date
       group by 1, 2, 3, 4, 5, 6`) {
    const lista = despesas.get(d.id_camara) ?? [];
    lista.push({
      mes: d.mes, categoria: d.categoria, fornecedor: d.fornecedor, cnpj: d.cnpj,
      tipoFornecedor: d.tipo_fornecedor, centavos: Number(d.centavos), documentos: d.documentos,
    });
    despesas.set(d.id_camara, lista);
  }

  const resultados: Array<{ id: number; uf: Uf; cota: CotaCalculada; meses: readonly string[] }> = deputados.map((d) => {
    const meses = mesesEmExercicio(historicos.get(d.id_camara) ?? [], periodo.meses);
    const cota = calcularCota(despesas.get(d.id_camara) ?? [], meses, (m) =>
      tetoCeap(d.sigla_uf, Number(m.slice(0, 4)), Number(m.slice(5, 7)))!.centavos,
    );
    return { id: d.id_camara, uf: d.sigla_uf, cota, meses };
  });
  const referencia = referenciaCotaPorUf(resultados);

  const coletas = [...new Set([...coletaCeap, coletaHistorico, ...deputados.map((d) => d.coleta_id)])];

  return sql.begin(async (tx) => {
    const [calculo] = await tx<{ id: string }[]>`
      insert into metrics.calculo (metrica, versao_metodo, periodo_inicio, periodo_fim, coleta_ids, versao_calculo)
      values ('MET-02', ${MET02_VERSAO}, ${`${periodo.inicio}-01`}, (${`${periodo.fim}-01`}::date + interval '1 month - 1 day')::date,
              ${coletas}::uuid[], ${versaoCalculo})
      returning id`;
    const calculoId = calculo!.id;

    for (const lote of fatiar(resultados, 500)) {
      await tx`insert into metrics.met02_cota ${tx(
        lote.map(({ id, uf, cota }) => ({
          calculo_id: calculoId,
          id_camara: id,
          sigla_uf: uf,
          meses_exercicio: cota.mesesEmExercicio,
          gasto_centavos: cota.gastoCentavos,
          teto_centavos: cota.tetoCentavos,
          percentual_teto: cota.percentualTeto,
          concentracao_top3: cota.concentracaoTop3,
          total_fornecedores: cota.totalFornecedores,
          entra_na_referencia: cota.mesesEmExercicio >= MET02_MIN_MESES_REFERENCIA && cota.percentualTeto !== null,
        })),
      )}`;
    }
    const categorias = resultados.flatMap(({ id, cota }) =>
      cota.porCategoria.map((c) => ({ calculo_id: calculoId, id_camara: id, categoria: c.categoria, centavos: c.centavos })),
    );
    for (const lote of fatiar(categorias, 3000)) await tx`insert into metrics.met02_categoria ${tx(lote)}`;
    const fornecedores = resultados.flatMap(({ id, cota }) =>
      cota.fornecedores.map((f, i) => ({
        calculo_id: calculoId, id_camara: id, posicao: i + 1, fornecedor: f.fornecedor, cnpj: f.cnpj,
        centavos: f.centavos, documentos: f.documentos,
      })),
    );
    for (const lote of fatiar(fornecedores, 3000)) await tx`insert into metrics.met02_fornecedor ${tx(lote)}`;

    const refs = [...referencia].map(([uf, r]) => ({
      calculo_id: calculoId, sigla_uf: uf, n: r.n, media: r.media, mediana: r.mediana, p25: r.p25, p75: r.p75,
      minimo: r.minimo, maximo: r.maximo, min_meses: MET02_MIN_MESES_REFERENCIA,
    }));
    if (refs.length) await tx`insert into metrics.met02_referencia_uf ${tx(refs)}`;

    // Mês a mês (gráfico mensal): todos os meses do período; só os em exercício entram no total.
    const porMes = resultados.flatMap(({ id, uf, meses }) => {
      const emExercicio = new Set(meses);
      const gastoMes = new Map<string, number>();
      for (const d of despesas.get(id) ?? []) gastoMes.set(d.mes, (gastoMes.get(d.mes) ?? 0) + d.centavos);
      return periodo.meses.map((m) => ({
        calculo_id: calculoId,
        id_camara: id,
        mes: m,
        em_exercicio: emExercicio.has(m),
        gasto_centavos: gastoMes.get(m) ?? 0,
        valor_base_centavos: tetoCeap(uf, Number(m.slice(0, 4)), Number(m.slice(5, 7)))!.centavos,
      }));
    });
    for (const lote of fatiar(porMes, 3000)) await tx`insert into metrics.met02_mes ${tx(lote)}`;

    const ufs = [...new Set(resultados.map((r) => r.uf))];
    const tetos = ufs.flatMap((uf) =>
      periodo.meses.map((m) => {
        const t = tetoCeap(uf, Number(m.slice(0, 4)), Number(m.slice(5, 7)))!;
        return { calculo_id: calculoId, sigla_uf: uf, mes: m, teto_centavos: t.centavos, norma: t.tabela.norma, fonte: t.tabela.fonte };
      }),
    );
    for (const lote of fatiar(tetos, 3000)) await tx`insert into metrics.met02_teto ${tx(lote)}`;

    return { calculoId, deputados: resultados.length, periodo: { inicio: periodo.inicio, fim: periodo.fim }, ufsComReferencia: refs.length };
  });
}
