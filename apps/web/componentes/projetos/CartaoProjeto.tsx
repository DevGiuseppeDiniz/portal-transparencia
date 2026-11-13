// Cartão de um projeto de lei: o que é, em que pé está e quem decide, em linguagem simples
// (regras em lib/projetos.ts, sem IA). Texto oficial e palavras-chave a um clique.

import type { EstagioFunil } from '@portal/metrics';
import type { ProjetoPublicado } from '@portal/metrics/publicacao';
import { data } from '../../lib/formato';
import { doQueTrata, quemDecide, situacaoSimples } from '../../lib/projetos';
import { Externo } from '../Icones';
import { Badge } from '../ui';

const ETAPAS: ReadonlyArray<{ chave: EstagioFunil; nome: string }> = [
  { chave: 'apresentada', nome: 'Apresentado' },
  { chave: 'comissao', nome: 'Parecer em comissão' },
  { chave: 'alem_comissao', nome: 'Passou das comissões' },
  { chave: 'aprovada_camara', nome: 'Aprovado na Câmara' },
  { chave: 'lei', nome: 'Virou lei' },
];

export function EtapasProjeto({ estagio }: { estagio: EstagioFunil }) {
  const ate = ETAPAS.findIndex((e) => e.chave === estagio);
  return (
    <ol className="flex items-center gap-1" aria-label={`Chegou até: ${ETAPAS[ate]?.nome}`}>
      {ETAPAS.map((e, i) => (
        <li key={e.chave} className="flex flex-1 flex-col gap-1" aria-current={i === ate ? 'step' : undefined}>
          <span className={`h-1.5 rounded-full ${i <= ate ? 'bg-deputado' : 'bg-muted'}`} />
          <span className={`hidden text-[11px] leading-tight sm:block ${i === ate ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{e.nome}</span>
        </li>
      ))}
    </ol>
  );
}

export function CartaoProjeto({ p }: { p: ProjetoPublicado }) {
  const resumo = doQueTrata(p);
  const decide = quemDecide(p.apreciacao);
  const urgente = p.regime && /urg[êe]ncia/i.test(p.regime);
  return (
    <article className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <header className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">
          {p.sigla} {p.numero}/{p.ano}
        </span>
        <span className="text-xs text-muted-foreground">apresentado em {data(p.apresentadoEm)}</span>
        {urgente && <Badge variante="outline">Em regime de urgência</Badge>}
      </header>
      {p.temas.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Temas">
          {p.temas.map((t) => (
            <li key={t}>
              <Badge className="bg-accent text-accent-foreground">{t}</Badge>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-base leading-relaxed text-pretty">{resumo.texto}</p>
      <p className="mt-1 text-xs text-muted-foreground">Fonte do texto: {resumo.origem}</p>

      <div className="mt-4 space-y-2">
        <p className="text-sm">
          <span className="font-medium">Situação: </span>
          {situacaoSimples(p.situacao)}
          {p.apensado && p.situacao !== 'Tramitando em Conjunto' && ' · anexado a outro projeto'}
        </p>
        <EtapasProjeto estagio={p.estagio} />
        {decide && <p className="text-xs text-muted-foreground">{decide}.</p>}
      </div>

      <details className="group mt-3 text-sm">
        <summary className="flex min-h-11 list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-open:rotate-90">
            <path d="m9 6 6 6-6 6" />
          </svg>
          Texto oficial e palavras-chave
        </summary>
        <p className="mt-1 text-muted-foreground">
          <span className="font-medium text-foreground">Ementa oficial: </span>
          {p.ementa}
        </p>
        {p.palavrasChave.length > 0 && (
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Palavras-chave da Câmara: </span>
            {p.palavrasChave.join(' · ')}
          </p>
        )}
        {p.situacao && (
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Situação, como a Câmara escreve: </span>
            {p.situacao}
          </p>
        )}
      </details>
      <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium">
        Ver o projeto na Câmara
        <Externo tamanho={14} />
        <span className="sr-only">(abre em nova aba)</span>
      </a>
    </article>
  );
}
