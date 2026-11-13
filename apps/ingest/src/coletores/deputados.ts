// Coletor SRC-01 — deputados em exercício (Câmara, /deputados).
// Fluxo com proveniência de ponta a ponta (DEC-10, 11-arquitetura#proveniência):
//
//   1. abre a coleta (raw.coleta, status em_andamento), já gravada antes de qualquer HTTP;
//   2. baixa todas as páginas e guarda o corpo de cada uma, exatamente como veio;
//   3. salva o pacote bruto no `raw` (endereçado por SHA-256), mesmo se a coleta falhar;
//   4. confere o total contra o X-Total-Count declarado pela própria Câmara;
//   5. numa transação: staging (append-only) + core + fecha a coleta.
//
// Só uma coleta com sucesso atualiza o core. Falha ou coleta parcial ficam registradas,
// com o bruto guardado, e o core continua no último estado bom.

import {
  ErroFormato,
  ErroHttp,
  lerPaginaDeputados,
  obter,
  urlDeputadosEmExercicio,
  urlPublicaDeputado,
  type DeputadoCamara,
  type OpcoesHttp,
  type RespostaBruta,
} from '@portal/sources';
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

const FONTE = 'SRC-01';
/** Trava contra loop de paginação (a lista tem ~513 deputados = 6 páginas). */
const MAX_PAGINAS = 20;

/** Baixa e interpreta todas as páginas. Em erro, devolve o que já tinha baixado. */
export async function baixarDeputados(http: OpcoesHttp = {}): Promise<{
  paginas: RespostaBruta[];
  deputados: DeputadoCamara[];
  erro: Error | null;
}> {
  const paginas: RespostaBruta[] = [];
  const deputados: DeputadoCamara[] = [];
  let url: string | null = urlDeputadosEmExercicio();
  try {
    while (url) {
      if (paginas.length >= MAX_PAGINAS) throw new ErroFormato(`mais de ${MAX_PAGINAS} páginas: paginação em loop?`);
      const resposta = await obter(url, http);
      paginas.push(resposta);
      const pagina = lerPaginaDeputados(resposta.corpo);
      deputados.push(...pagina.dados);
      url = pagina.proxima;
    }
    return { paginas, deputados, erro: null };
  } catch (e) {
    return { paginas, deputados, erro: e instanceof Error ? e : new Error(String(e)) };
  }
}

/** Confere o lote antes de gravar. Devolve o motivo de ser só parcial, ou null se ok. */
export function conferirLote(deputados: readonly DeputadoCamara[], primeira: RespostaBruta): string | null {
  const ids = new Set(deputados.map((d) => d.id));
  if (ids.size !== deputados.length) return `${deputados.length - ids.size} id(s) repetido(s) entre páginas`;
  const declarado = Number(primeira.cabecalhos['x-total-count']);
  if (!Number.isSafeInteger(declarado)) return 'a Câmara não declarou X-Total-Count';
  if (declarado !== deputados.length) return `a Câmara declarou ${declarado} deputados e vieram ${deputados.length}`;
  return null;
}

export async function coletarDeputados(deps: Dependencias): Promise<ResultadoColeta> {
  const { sql, raw, versao, http = {}, agora = () => new Date() } = deps;
  const urlRequisitada = urlDeputadosEmExercicio();
  const coletaId = await abrirColeta(sql, FONTE, urlRequisitada, versao);

  const { paginas, deputados, erro: erroDownload } = await baixarDeputados(http);
  const ultimoStatus = paginas.at(-1)?.status ?? (erroDownload instanceof ErroHttp ? erroDownload.status : null);

  let objeto: ObjetoRaw | null = null;
  try {
    if (paginas.length > 0) objeto = await salvarPacote(raw, FONTE, coletaId, urlRequisitada, paginas, agora());
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', null, ultimoStatus, 0, `falha ao salvar o raw: ${descreverErro(e)}`);
  }

  if (erroDownload) {
    return fecharColeta(sql, coletaId, 'falha', objeto, ultimoStatus, deputados.length, descreverErro(erroDownload));
  }

  const motivoParcial = conferirLote(deputados, paginas[0]!);
  const obtidoEm = new Date(paginas.at(-1)!.recebidaEm);

  try {
    return await sql.begin(async (tx) => {
      for (const lote of fatiar(deputados, 200)) {
        await tx`insert into staging.camara_deputado ${tx(
          lote.map((d) => ({
            coleta_id: coletaId,
            fonte_id: FONTE,
            obtido_em: obtidoEm,
            url_origem_publica: urlPublicaDeputado(d.id),
            id_camara: d.id,
            nome: d.nome,
            sigla_partido: d.siglaPartido,
            sigla_uf: d.siglaUf,
            id_legislatura: d.idLegislatura,
            url_foto: d.urlFoto,
            email: d.email,
          })),
        )}`;
      }

      if (motivoParcial === null) {
        await tx`
          insert into core.deputado (
            id_camara, nome, sigla_partido, sigla_uf, id_legislatura, url_foto, email,
            em_exercicio, coleta_id, fonte_id, obtido_em, url_origem_publica)
          select id_camara, nome, sigla_partido, sigla_uf, id_legislatura, url_foto, email,
                 true, coleta_id, fonte_id, obtido_em, url_origem_publica
            from staging.camara_deputado
           where coleta_id = ${coletaId}
          on conflict (id_camara) do update set
            nome = excluded.nome, sigla_partido = excluded.sigla_partido, sigla_uf = excluded.sigla_uf,
            id_legislatura = excluded.id_legislatura, url_foto = excluded.url_foto, email = excluded.email,
            em_exercicio = true, coleta_id = excluded.coleta_id, fonte_id = excluded.fonte_id,
            obtido_em = excluded.obtido_em, url_origem_publica = excluded.url_origem_publica`;
        // Quem saiu da lista (licença, suplente que deixou o cargo) continua no core, sem
        // exercício, apontando para a coleta que constatou a saída.
        await tx`
          update core.deputado
             set em_exercicio = false, coleta_id = ${coletaId}, obtido_em = ${obtidoEm}
           where em_exercicio
             and id_camara not in (select id_camara from staging.camara_deputado where coleta_id = ${coletaId})`;
      }

      return fecharColeta(tx, coletaId, motivoParcial ? 'parcial' : 'sucesso', objeto, ultimoStatus, deputados.length, motivoParcial);
    });
  } catch (e) {
    return fecharColeta(sql, coletaId, 'falha', objeto, ultimoStatus, 0, `falha ao gravar: ${descreverErro(e)}`);
  }
}
