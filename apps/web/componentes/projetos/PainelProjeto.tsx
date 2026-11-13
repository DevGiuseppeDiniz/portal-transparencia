'use client';

// Painel lateral de detalhes de um projeto (padrão "Sheet" do shadcn/ui), com o <dialog>
// nativo: foco preso, Esc fecha e fundo escurecido, sem biblioteca. À direita no desktop,
// tela cheia no celular. Tudo vem do que a Câmara publica (lib/projetos.ts, sem IA).

import { useEffect, useRef } from 'react';
import type { ProjetoPublicado } from '@portal/metrics/publicacao';
import { data } from '../../lib/formato';
import { doQueTrata, quemDecide, situacaoSimples } from '../../lib/projetos';
import { Externo } from '../Icones';
import { Badge, botao } from '../ui';
import { EtapasProjeto } from './EtapasProjeto';

function Item({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="border-t py-4">
      <dt className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{rotulo}</dt>
      <dd className="text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

export function PainelProjeto({ projeto, aoFechar }: { projeto: ProjetoPublicado | null; aoFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (projeto && !d.open) d.showModal();
    if (!projeto && d.open) d.close();
  }, [projeto]);

  const p = projeto;
  const resumo = p ? doQueTrata(p) : null;
  const decide = p ? quemDecide(p.apreciacao) : null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="painel-projeto-titulo"
      onClose={aoFechar}
      onClick={(e) => {
        if (e.target === ref.current) aoFechar(); // clique no fundo fecha
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-full overflow-y-auto border-l bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/40 sm:max-w-xl"
    >
      {p && resumo && (
        <div className="flex min-h-full flex-col">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-background/95 px-5 py-4 backdrop-blur">
            <div>
              <p className="text-xs text-muted-foreground">Apresentado em {data(p.apresentadoEm)}</p>
              <h2 id="painel-projeto-titulo" className="text-xl font-semibold tracking-tight">
                {p.sigla} {p.numero}/{p.ano}
              </h2>
            </div>
            <button type="button" onClick={aoFechar} className={botao('ghost', 'sm')} aria-label="Fechar detalhes do projeto">
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div className="flex-1 px-5 pb-6">
            {p.temas.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Temas">
                {p.temas.map((t) => (
                  <li key={t}>
                    <Badge className="bg-accent text-accent-foreground">{t}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-lg leading-relaxed text-pretty">{resumo.texto}</p>
            <p className="mt-1 mb-4 text-xs text-muted-foreground">Fonte do texto: {resumo.origem}</p>

            <dl>
              <Item rotulo="Em que pé está">
                <p className="mb-3 font-medium">{situacaoSimples(p.situacao)}</p>
                <EtapasProjeto estagio={p.estagio} />
                {p.apensado && (
                  <p className="mt-3 text-muted-foreground">
                    Este projeto foi anexado a outro parecido e tramita junto com ele; o conteúdo pode seguir no projeto principal.
                  </p>
                )}
              </Item>
              {(decide || p.regime) && (
                <Item rotulo="Quem decide e com que pressa">
                  {decide && <p>{decide}.</p>}
                  {p.regime && <p className="text-muted-foreground">Regime: {p.regime}.</p>}
                </Item>
              )}
              <Item rotulo="Ementa oficial">{p.ementa}</Item>
              {p.palavrasChave.length > 0 && (
                <Item rotulo="Palavras-chave da Câmara">
                  <ul className="flex flex-wrap gap-1.5">
                    {p.palavrasChave.map((k) => (
                      <li key={k}>
                        <Badge variante="outline">{k}</Badge>
                      </li>
                    ))}
                  </ul>
                </Item>
              )}
              {p.situacao && <Item rotulo="Situação, como a Câmara escreve">{p.situacao}</Item>}
            </dl>
          </div>

          <footer className="sticky bottom-0 border-t bg-background/95 px-5 py-4 backdrop-blur">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className={`${botao('default')} w-full`}>
              Ver o projeto completo na Câmara
              <Externo tamanho={16} />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </footer>
        </div>
      )}
    </dialog>
  );
}
