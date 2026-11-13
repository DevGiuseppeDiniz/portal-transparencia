// Coletores da MET-02 (cota parlamentar):
//   - Ano-{ano}.csv.zip (SRC-01c): o arquivo oficial é guardado byte a byte no raw;
//   - /deputados/{id}/historico (SRC-01): entradas e saídas de exercício (meses com teto).

import { CAMARA_API, lerCeapZip, lerHistorico, obter, obterBytes, urlCeapAno, urlHistoricoDeputado, ErroHttp, type RespostaBruta } from '@portal/sources';
import {
  abrirColeta,
  descreverErro,
  fatiar,
  fecharColeta,
  salvarPacote,
  type Dependencias,
  type ResultadoColeta,
} from '../coleta.ts';
import type { ObjetoRaw } from '../raw.ts';

/** Chave em core.coleta_vigente do arquivo de um ano. */
export const chaveCeap = (ano: number) => `ceap:${ano}`;
export const CHAVE_HISTORICO = 'historico';

export async function coletarCeapAno(deps: Dependencias, ano: number): Promise<ResultadoColeta> {
  const { sql, raw, versao, http = {}, agora = () => new Date() } = deps;
  const url = urlCeapAno(ano);
  const coletaId = await abrirColeta(sql, 'SRC-01c', url, versao);

  let bytes: Buffer;
  let statusHttp: number;
  let recebidaEm: string;
  try {
    const r = await obterBytes(url, http);
    ({ bytes, status: statusHttp, recebidaEm } = r);
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', null, e instanceof ErroHttp ? e.status : null, 0, descreverErro(e));
  }

  let objeto: ObjetoRaw;
  try {
    objeto = await raw.salvarArquivo('SRC-01c', bytes, 'zip', agora());
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', null, statusHttp, 0, `falha ao salvar o raw: ${descreverErro(e)}`);
  }

  // Arquivo idêntico ao da coleta vigente: registra a conferência, sem duplicar 200 mil linhas.
  const [vigente] = await sql<{ hash_conteudo: string; registros: number }[]>`
    select c.hash_conteudo, c.registros
      from core.coleta_vigente v join raw.coleta c on c.id = v.coleta_id
     where v.chave = ${chaveCeap(ano)}`;
  if (vigente?.hash_conteudo === objeto.hash) {
    return fecharColeta(sql, coletaId, 'sucesso', objeto, statusHttp, vigente.registros, null);
  }

  let despesas: ReturnType<typeof lerCeapZip>;
  try {
    despesas = lerCeapZip(bytes, ano);
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', objeto, statusHttp, 0, descreverErro(e));
  }

  const obtidoEm = new Date(recebidaEm);
  try {
    return await sql.begin(async (tx) => {
      let linha = 0;
      for (const lote of fatiar(despesas, 3000)) {
        await tx`insert into staging.camara_despesa ${tx(
          lote.map((d) => ({
            coleta_id: coletaId,
            fonte_id: 'SRC-01c',
            obtido_em: obtidoEm,
            url_origem_publica: d.urlDocumento ?? url,
            linha: ++linha,
            id_camara: d.idCamara,
            ano: d.ano,
            mes: d.mes,
            categoria: d.categoria,
            subcota: d.subcota,
            fornecedor: d.fornecedor,
            cnpj: d.cnpj,
            tipo_fornecedor: d.tipoFornecedor,
            data_emissao: d.dataEmissao,
            valor_documento: d.valorDocumentoCentavos,
            valor_glosa: d.valorGlosaCentavos,
            valor_liquido: d.valorLiquidoCentavos,
            id_documento: d.idDocumento,
            url_documento: d.urlDocumento,
          })),
        )}`;
      }
      await tx`
        insert into core.coleta_vigente (chave, coleta_id, obtido_em)
        values (${chaveCeap(ano)}, ${coletaId}, ${obtidoEm})
        on conflict (chave) do update set coleta_id = excluded.coleta_id, obtido_em = excluded.obtido_em`;
      return fecharColeta(tx, coletaId, 'sucesso', objeto, statusHttp, despesas.length, null);
    });
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', objeto, statusHttp, 0, `falha ao gravar: ${descreverErro(e)}`);
  }
}

/**
 * Histórico de todos os deputados em exercício, numa coleta só (uma execução). O pacote bruto
 * guarda a URL exata de cada um; `url_requisitada` registra o padrão com {id}.
 */
export async function coletarHistoricos(deps: Dependencias, simultaneas = 4): Promise<ResultadoColeta> {
  const { sql, raw, versao, http = {}, agora = () => new Date() } = deps;
  const padrao = `${CAMARA_API}/deputados/{id}/historico`;
  const coletaId = await abrirColeta(sql, 'SRC-01', padrao, versao);
  const ids = (await sql<{ id_camara: number }[]>`select id_camara from core.deputado where em_exercicio order by id_camara`).map((l) => l.id_camara);

  const respostas = new Map<number, RespostaBruta>();
  let erro: unknown = null;
  let proximo = 0;
  const trabalhador = async () => {
    while (proximo < ids.length && erro === null) {
      const id = ids[proximo++]!;
      try {
        respostas.set(id, await obter(urlHistoricoDeputado(id), http));
      } catch (e) {
        erro = e;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(simultaneas, ids.length) }, trabalhador));

  const paginas = ids.filter((id) => respostas.has(id)).map((id) => respostas.get(id)!);
  let objeto: ObjetoRaw | null = null;
  try {
    if (paginas.length) objeto = await salvarPacote(raw, 'SRC-01', coletaId, padrao, paginas, agora());
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', null, null, 0, `falha ao salvar o raw: ${descreverErro(e)}`);
  }
  if (erro !== null) return fecharColeta(sql, coletaId, 'falha', objeto, erro instanceof ErroHttp ? erro.status : null, 0, descreverErro(erro));
  if (ids.length === 0) return fecharColeta(sql, coletaId, 'falha', null, null, 0, 'nenhum deputado em exercício no core (rode a etapa deputados antes)');

  try {
    const linhas = ids.flatMap((id) => {
      const r = respostas.get(id)!;
      return lerHistorico(r.corpo).map((h, ordem) => ({
        coleta_id: coletaId,
        fonte_id: 'SRC-01',
        obtido_em: new Date(r.recebidaEm),
        url_origem_publica: r.url,
        id_camara: id,
        ordem,
        data_hora: h.dataHora,
        situacao: h.situacao,
        descricao_status: h.descricaoStatus,
        id_legislatura: h.idLegislatura,
      }));
    });
    return await sql.begin(async (tx) => {
      for (const lote of fatiar(linhas, 3000)) await tx`insert into staging.camara_historico ${tx(lote)}`;
      await tx`
        insert into core.coleta_vigente (chave, coleta_id, obtido_em)
        values (${CHAVE_HISTORICO}, ${coletaId}, now())
        on conflict (chave) do update set coleta_id = excluded.coleta_id, obtido_em = excluded.obtido_em`;
      return fecharColeta(tx, coletaId, 'sucesso', objeto, 200, linhas.length, null);
    });
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', objeto, 200, 0, descreverErro(e));
  }
}
