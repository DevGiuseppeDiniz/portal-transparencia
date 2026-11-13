// Catálogo das fontes (docs/07-fontes-de-dados.md). Um cliente por fonte entra aqui
// (paginação, retry, rate limit), um arquivo por fonte. HTTP comum em http.ts.

export type FonteId =
  | 'SRC-01'
  | 'SRC-01b'
  | 'SRC-01c'
  | 'SRC-01d'
  | 'SRC-02'
  | 'SRC-03'
  | 'SRC-04'
  | 'SRC-06'
  | 'SRC-07'
  | 'SRC-08'
  | 'SRC-09'
  | 'SRC-10';

export interface Fonte {
  readonly id: FonteId;
  readonly nome: string;
  readonly urlBase: string;
  /** Entra no MVP (DEC-11)? */
  readonly mvp: boolean;
}

export const FONTES: readonly Fonte[] = [
  { id: 'SRC-01', nome: 'Câmara dos Deputados — API v2', urlBase: 'https://dadosabertos.camara.leg.br/api/v2', mvp: true },
  { id: 'SRC-01b', nome: 'Câmara — arquivos em massa', urlBase: 'https://dadosabertos.camara.leg.br/arquivos', mvp: true },
  { id: 'SRC-01c', nome: 'Câmara — cota parlamentar (CEAP)', urlBase: 'https://www.camara.leg.br/cotas', mvp: true },
  { id: 'SRC-01d', nome: 'Câmara — webservices legados (frequência)', urlBase: 'https://www.camara.leg.br/SitCamaraWS', mvp: true },
  { id: 'SRC-02', nome: 'TSE — Dados Abertos', urlBase: 'https://dadosabertos.tse.jus.br', mvp: false },
  { id: 'SRC-03', nome: 'CGU — Portal da Transparência', urlBase: 'https://api.portaldatransparencia.gov.br', mvp: false },
  { id: 'SRC-04', nome: 'Receita Federal — CNPJ', urlBase: 'https://dadosabertos.rfb.gov.br', mvp: false },
  { id: 'SRC-06', nome: 'CNJ — DataJud', urlBase: 'https://api-publica.datajud.cnj.jus.br', mvp: false },
  { id: 'SRC-07', nome: 'STF — Corte Aberta', urlBase: 'https://portal.stf.jus.br/hotsites/corteaberta', mvp: false },
  { id: 'SRC-08', nome: 'TCU — contas julgadas irregulares', urlBase: 'https://portal.tcu.gov.br', mvp: false },
  { id: 'SRC-09', nome: 'Transferegov — emendas', urlBase: 'https://www.gov.br/transferegov', mvp: false },
  { id: 'SRC-10', nome: 'Tesouro Transparente — emendas', urlBase: 'https://www.tesourotransparente.gov.br', mvp: false },
];

export { obter, obterBytes, lerRetryAfter, ErroHttp, type RespostaBruta, type RespostaBinaria, type OpcoesHttp } from './http.ts';
export { lerZip, lerCsv, ErroArquivo } from './arquivos.ts';
export {
  CAMARA_API,
  CAMARA_ARQUIVOS,
  LEGISLATURA_ATUAL,
  ITENS_POR_PAGINA,
  UFS,
  ErroFormato,
  lerArquivoEventos,
  lerHistorico,
  lerPaginaDeputados,
  urlDeputadosEmExercicio,
  urlEventosAno,
  urlHistoricoDeputado,
  urlPublicaDeputado,
  type DeputadoCamara,
  type EventoCamara,
  type EventoHistorico,
  type PaginaCamara,
  type Uf,
} from './camara.ts';
export {
  CAMARA_WS,
  FREQUENCIAS_DIA,
  lerObterDeputados,
  lerPresencasDia,
  urlObterDeputados,
  urlPresencasDia,
  type DiaDePresenca,
  type FrequenciaDia,
  type MatriculaDeputado,
  type PresencaDia,
} from './camara-legado.ts';
export { lerXml, filhos, textoDe, ErroXml, type NoXml } from './xml.ts';
export {
  TETOS_CEAP,
  centavos,
  lerCeapCsv,
  lerCeapZip,
  tetoCeap,
  urlCeapAno,
  type DespesaCeap,
  type TabelaTeto,
} from './ceap.ts';
export {
  TIPOS_FUNIL,
  lerAutoresCsv,
  lerProposicoesCsv,
  lerTramitacoesCsv,
  urlArquivoProposicoes,
  type AutorProposicao,
  type ConjuntoProposicoes,
  type LeituraCsv,
  type ProposicaoCamara,
  type TipoFunil,
  type TramitacaoCamara,
} from './proposicoes.ts';
