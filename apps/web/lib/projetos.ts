// Projetos de lei em linguagem acessível, SEM IA e sem texto mantido à mão: só regras sobre o
// que a própria Câmara publica (ementa detalhada, ementa, palavras-chave, situação). Toda
// simplificação diz de onde veio, e a ementa oficial fica sempre a um clique.

import type { ProjetoPublicado } from '@portal/metrics/publicacao';

export interface DoQueTrata {
  readonly texto: string;
  /** De onde veio o texto, mostrado ao lado (transparência). */
  readonly origem: 'Resumo da Câmara' | 'Trecho da ementa oficial' | 'Ementa oficial' | 'Palavras-chave da Câmara';
}

/** Ementas que começam assim citam primeiro a lei alterada; o objetivo vem depois de "para". */
const ALTERA = /^(altera|acrescenta|dá nova redação|modifica|inclui|insere|revoga|acresce)/i;
/** Ementas que já começam dizendo o que fazem. */
const DIRETA = /^(esta lei|institui|dispõe|cria|proíbe|estabelece|obriga|autoriza|garante|torna|concede|declara|denomina|assegura|determina|regulamenta|define|veda|confere|inscreve|reconhece|isenta|amplia|reduz|susta|fixa|permite|prevê)/i;

const fecharFrase = (t: string) => (/[.!?]$/.test(t) ? t : `${t}.`);

export function doQueTrata(p: Pick<ProjetoPublicado, 'resumo' | 'ementa' | 'palavrasChave'>): DoQueTrata {
  if (p.resumo && p.resumo.trim().length > 10) return { texto: fecharFrase(p.resumo.trim()), origem: 'Resumo da Câmara' };
  // Algumas ementas vêm entre aspas ("Dispõe sobre…").
  const ementa = p.ementa.trim().replace(/^["“]+|["”]+$/g, '').trim();
  if (ALTERA.test(ementa)) {
    // O objetivo é o "para" seguido de verbo no infinitivo ("para permitir…", "para incluir…").
    // Um "para" seguido de artigo costuma estar no nome da lei citada ("diretrizes para o
    // saneamento básico") e não serve.
    // "a fim de" + infinitivo também marca o objetivo.
    const m = /,?\s+(?:para|a fim de)\s+((?:[a-zà-ú]+(?:ar|er|ir|or)(?:-(?:se|lhe|lo|la|los|las))?)\b.{10,})$/iu.exec(ementa);
    // O trecho começa no infinitivo ("permitir…", "estabelecer…"): vira "Objetivo: permitir…".
    if (m) return { texto: `Objetivo: ${fecharFrase(m[1]!.trim().replace(/^./, (c) => c.toLocaleLowerCase('pt-BR')))}`, origem: 'Trecho da ementa oficial' };
  }
  if (DIRETA.test(ementa)) return { texto: fecharFrase(ementa), origem: 'Ementa oficial' };
  if (p.palavrasChave.length) return { texto: p.palavrasChave.slice(0, 8).join(' · '), origem: 'Palavras-chave da Câmara' };
  return { texto: fecharFrase(ementa), origem: 'Ementa oficial' };
}

/**
 * Situação atual em linguagem simples. Mapa fixo das situações da Câmara (mudam muito
 * raramente); situação desconhecida aparece como a Câmara escreve, sem quebrar nada.
 */
const SITUACOES: ReadonlyArray<[RegExp, string]> = [
  [/^Transformad[oa] em Norma Jurídica/i, 'Virou lei'],
  [/^Aguardando Sanção/i, 'Aprovado pelo Congresso; aguarda a sanção do presidente da República'],
  [/^Aguardando Apreciação do Veto/i, 'Teve veto do presidente da República; aguarda o Congresso decidir sobre o veto'],
  [/^Aguardando Apreciação pelo Senado/i, 'Aprovado na Câmara; está no Senado'],
  [/^Aguardando (Envio ao Senado|Autógrafos)/i, 'Aprovado na Câmara; sendo enviado ao Senado'],
  [/^Aguardando (Envio à )?Redação Final/i, 'Aprovado; na fase de redação final do texto'],
  [/^Pronta para Pauta/i, 'Pronto para ser votado; aguarda entrar na pauta'],
  [/^Aguardando Parecer/i, 'Com relator; aguarda o parecer (a opinião do relator) na comissão'],
  [/^Aguardando Designação de Relator/i, 'Aguarda a escolha de um relator na comissão'],
  [/^Aguardando Designação - Aguardando Devolução/i, 'Aguarda novo relator (o anterior saiu da comissão)'],
  [/^Tramitando em Conjunto/i, 'Anexado a outro projeto parecido; os dois tramitam juntos'],
  [/^Aguardando Apensação/i, 'Será anexado a outro projeto parecido'],
  [/^Aguardando Despacho do Presidente/i, 'Aguarda a presidência da Câmara definir por quais comissões vai passar'],
  [/^Aguardando (Autorização|Chancela)/i, 'Aguarda despacho da Mesa da Câmara'],
  [/^Aguardando (Criação|Constituição) de Comissão/i, 'Aguarda a criação de uma comissão especial para analisá-lo'],
  [/^Aguardando Vistas/i, 'Um deputado pediu mais tempo para analisar (vista)'],
  [/^Aguardando (Deliberação de )?Recurso/i, 'Há um recurso para o Plenário votar o projeto'],
  [/^Aguardando Deliberação/i, 'Aguarda votação'],
  [/^Aguardando (Encaminhamento|Definição Encaminhamento)/i, 'Aguarda encaminhamento interno'],
  [/^Aguardando Análise de Parecer/i, 'Parecer apresentado; aguarda análise'],
  [/^Ag\. Análise de Inconstitucionalidade/i, 'Em análise sobre se fere a Constituição'],
  [/^Arquivad/i, 'Arquivado (parou de tramitar)'],
  [/^Retirad[oa] pel[oa]/i, 'Retirado pelo próprio autor'],
  [/^Devolvid[oa] ao/i, 'Devolvido ao autor (não foi aceito para tramitar)'],
  [/^Transformad[oa] em nova proposição/i, 'Virou outro projeto'],
];

export function situacaoSimples(situacao: string | null): string {
  if (!situacao) return 'Situação não informada pela Câmara';
  return SITUACOES.find(([re]) => re.test(situacao))?.[1] ?? situacao;
}

export function quemDecide(apreciacao: string | null): string | null {
  if (!apreciacao) return null;
  if (/Conclusiva/i.test(apreciacao)) return 'Decidido nas comissões (só vai ao Plenário se houver recurso)';
  if (/Plenário/i.test(apreciacao)) return 'Precisa ser votado no Plenário';
  return null;
}
