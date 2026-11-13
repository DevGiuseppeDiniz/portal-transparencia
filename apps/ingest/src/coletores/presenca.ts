// Coletores da MET-01 (presença em sessões deliberativas):
//   - eventos-{ano} (SRC-01b): de onde saem os dias com sessão deliberativa no Plenário;
//   - ObterDeputados (SRC-01d): liga a matrícula da frequência ao id da API v2;
//   - ListarPresencasDia (SRC-01d): frequência oficial do dia, uma coleta por dia.
// O webservice de frequência é lento (~7 s por chamada); por isso só os dias com sessão
// deliberativa são consultados, e cada dia já coletado só é refeito na janela recente.

import {
  LEGISLATURA_ATUAL,
  lerArquivoEventos,
  lerObterDeputados,
  lerPresencasDia,
  urlEventosAno,
  urlObterDeputados,
  urlPresencasDia,
} from '@portal/sources';
import { coletarUrl, fatiar, type Dependencias, type ResultadoColeta } from '../coleta.ts';

/** Justificativa de ausência pode ser registrada depois; os dias recentes são recoletados. */
export const JANELA_RECOLETA_DIAS = 60;
const TIPO_SESSAO = 'Sessão Deliberativa';

export async function coletarEventos(deps: Dependencias, hoje = new Date()): Promise<ResultadoColeta[]> {
  const anoInicio = Number(LEGISLATURA_ATUAL.inicio.slice(0, 4));
  const anoAtual = hoje.getUTCFullYear();
  const resultados: ResultadoColeta[] = [];
  for (let ano = anoInicio; ano <= anoAtual; ano++) {
    const url = urlEventosAno(ano);
    // Ano fechado com coleta boa não muda; o ano corrente (e o anterior, em janeiro) sim.
    if (ano < anoAtual - (hoje.getUTCMonth() === 0 ? 1 : 0)) {
      const [ja] = await deps.sql`select 1 from raw.coleta where url_requisitada = ${url} and status = 'sucesso' limit 1`;
      if (ja) continue;
    }
    resultados.push(
      await coletarUrl(deps, 'SRC-01b', url, lerArquivoEventos, async (tx, eventos, { coletaId, obtidoEm }) => {
        for (const lote of fatiar(eventos, 500)) {
          await tx`insert into staging.camara_evento ${tx(
            lote.map((e) => ({
              coleta_id: coletaId,
              fonte_id: 'SRC-01b',
              obtido_em: obtidoEm,
              url_origem_publica: `https://dadosabertos.camara.leg.br/api/v2/eventos/${e.id}`,
              id_evento: e.id,
              data_hora_inicio: e.dataHoraInicio,
              descricao_tipo: e.descricaoTipo,
              situacao: e.situacao,
              local: e.local,
            })),
          )}`;
        }
        await tx`
          insert into core.evento (id_evento, data_hora_inicio, descricao_tipo, situacao, local,
                                   coleta_id, fonte_id, obtido_em, url_origem_publica)
          select id_evento, data_hora_inicio, descricao_tipo, situacao, local,
                 coleta_id, fonte_id, obtido_em, url_origem_publica
            from staging.camara_evento where coleta_id = ${coletaId}
          on conflict (id_evento) do update set
            data_hora_inicio = excluded.data_hora_inicio, descricao_tipo = excluded.descricao_tipo,
            situacao = excluded.situacao, local = excluded.local, coleta_id = excluded.coleta_id,
            fonte_id = excluded.fonte_id, obtido_em = excluded.obtido_em,
            url_origem_publica = excluded.url_origem_publica`;
        return { registros: eventos.length };
      }),
    );
  }
  return resultados;
}

export async function coletarMatriculas(deps: Dependencias): Promise<ResultadoColeta> {
  const url = urlObterDeputados();
  return coletarUrl(deps, 'SRC-01d', url, lerObterDeputados, async (tx, matriculas, { coletaId, obtidoEm }) => {
    if (new Set(matriculas.map((m) => m.matricula)).size !== matriculas.length) {
      throw new Error('matrícula repetida na lista de deputados');
    }
    await tx`insert into staging.camara_matricula ${tx(
      matriculas.map((m) => ({
        coleta_id: coletaId,
        fonte_id: 'SRC-01d',
        obtido_em: obtidoEm,
        url_origem_publica: url,
        matricula: m.matricula,
        id_camara: m.idCamara,
        nome_parlamentar: m.nomeParlamentar,
        condicao: m.condicao,
        sigla_uf: m.siglaUf,
      })),
    )}`;
    await tx`
      insert into core.deputado_matricula (matricula, id_camara, coleta_id, fonte_id, obtido_em, url_origem_publica)
      select matricula, id_camara, coleta_id, fonte_id, obtido_em, url_origem_publica
        from staging.camara_matricula where coleta_id = ${coletaId}
      on conflict (matricula) do update set
        id_camara = excluded.id_camara, coleta_id = excluded.coleta_id,
        obtido_em = excluded.obtido_em, url_origem_publica = excluded.url_origem_publica`;
    return { registros: matriculas.length };
  });
}

/** Dias de sessão deliberativa (não cancelada) ainda sem frequência coletada, ou recentes. */
export async function diasParaColetar(deps: Dependencias, hoje = new Date()): Promise<string[]> {
  const ontem = new Date(hoje.getTime() - 86_400_000).toISOString().slice(0, 10);
  const inicioJanela = new Date(hoje.getTime() - JANELA_RECOLETA_DIAS * 86_400_000).toISOString().slice(0, 10);
  const linhas = await deps.sql<{ data: string }[]>`
    select distinct to_char(e.data_hora_inicio::date, 'YYYY-MM-DD') as data
      from core.evento e
     where e.descricao_tipo = ${TIPO_SESSAO}
       and coalesce(e.situacao, '') <> 'Cancelada'
       and e.data_hora_inicio::date between ${LEGISLATURA_ATUAL.inicio}::date and ${ontem}::date
       and (e.data_hora_inicio::date >= ${inicioJanela}::date
            or not exists (select 1 from core.presenca_dia_coletado c where c.data = e.data_hora_inicio::date))
     order by data`;
  return linhas.map((l) => l.data);
}

export async function coletarPresencaDia(deps: Dependencias, data: string): Promise<ResultadoColeta> {
  const url = urlPresencasDia(data, LEGISLATURA_ATUAL.id);
  return coletarUrl(deps, 'SRC-01d', url, (corpo) => lerPresencasDia(corpo, data), async (tx, dia, { coletaId, obtidoEm }) => {
    if (dia.presencas.length > 0) {
      await tx`insert into staging.camara_presenca_dia ${tx(
        dia.presencas.map((p) => ({
          coleta_id: coletaId,
          fonte_id: 'SRC-01d',
          obtido_em: obtidoEm,
          url_origem_publica: url,
          data,
          matricula: p.matricula,
          nome_parlamentar: p.nomeParlamentar,
          sigla_partido: p.siglaPartido,
          sigla_uf: p.siglaUf,
          frequencia: p.frequencia,
          justificativa: p.justificativa,
          sessoes: p.sessoes,
          sessoes_presente: p.sessoesPresente,
        })),
      )}`;
      await tx`
        insert into core.presenca_dia (data, matricula, frequencia, justificativa, sessoes, sessoes_presente,
                                       coleta_id, fonte_id, obtido_em, url_origem_publica)
        select data, matricula, frequencia, justificativa, sessoes, sessoes_presente,
               coleta_id, fonte_id, obtido_em, url_origem_publica
          from staging.camara_presenca_dia where coleta_id = ${coletaId}
        on conflict (data, matricula) do update set
          frequencia = excluded.frequencia, justificativa = excluded.justificativa,
          sessoes = excluded.sessoes, sessoes_presente = excluded.sessoes_presente,
          coleta_id = excluded.coleta_id, obtido_em = excluded.obtido_em,
          url_origem_publica = excluded.url_origem_publica`;
    }
    await tx`
      insert into core.presenca_dia_coletado (data, qtde_sessoes, coleta_id, obtido_em)
      values (${data}, ${dia.qtdeSessoes}, ${coletaId}, ${obtidoEm})
      on conflict (data) do update set
        qtde_sessoes = excluded.qtde_sessoes, coleta_id = excluded.coleta_id, obtido_em = excluded.obtido_em`;
    return { registros: dia.presencas.length };
  });
}

/** Coleta vários dias com poucas conexões simultâneas (o webservice é lento e é público). */
export async function coletarPresencas(
  deps: Dependencias,
  dias: readonly string[],
  simultaneas = 3,
  aoTerminar?: (data: string, r: ResultadoColeta, feitos: number) => void,
): Promise<ResultadoColeta[]> {
  const resultados: ResultadoColeta[] = [];
  let proximo = 0;
  const trabalhador = async () => {
    while (proximo < dias.length) {
      const data = dias[proximo++]!;
      const r = await coletarPresencaDia(deps, data);
      resultados.push(r);
      aoTerminar?.(data, r, resultados.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(simultaneas, dias.length) }, trabalhador));
  return resultados;
}
