// Página de um projeto de lei do deputado. Tudo vem do que a Câmara publica (lib/projetos.ts,
// sem IA e sem texto mantido à mão); a simplificação diz de onde veio e a ementa oficial
// aparece inteira. Sem nota, ranking ou adjetivo (PRI-01).
//
// São ~20 mil projetos: as páginas NÃO são geradas no build (pesaria o build e o disco). Cada
// uma é gerada na primeira visita a partir do snapshot publicado e fica em cache até o próximo
// build (force-static + dynamicParams: ISR sob demanda, sem revalidação). Só leitura (DEC-12).

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import type { DeputadoPublicado, ProjetoPublicado } from '@portal/metrics/publicacao';
import { Externo } from '../../../../../componentes/Icones';
import { EtapasProjeto } from '../../../../../componentes/projetos/EtapasProjeto';
import { Voltar } from '../../../../../componentes/Voltar';
import { Badge, Card, CardContent, CardHeader, CardTitle, botao } from '../../../../../componentes/ui';
import { lerDeputado, nomeUf } from '../../../../../lib/dados';
import { data } from '../../../../../lib/formato';
import { doQueTrata, quemDecide, situacaoSimples } from '../../../../../lib/projetos';

export const dynamic = 'force-static';
export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return [];
}

const TIPO: Readonly<Record<string, string>> = {
  PL: 'Projeto de lei',
  PLP: 'Projeto de lei complementar',
  PEC: 'Proposta de emenda à Constituição',
};

type Params = { params: Promise<{ id: string; projeto: string }> };

function ler(id: string, projeto: string): { d: DeputadoPublicado; p: ProjetoPublicado } | null {
  if (!/^\d{1,9}$/.test(projeto)) return null;
  const d = lerDeputado(id);
  const p = d?.projetos?.lista.find((x) => x.id === Number(projeto));
  return d && p ? { d, p } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id, projeto } = await params;
  const r = ler(id, projeto);
  if (!r) return {};
  return {
    title: `${r.p.sigla} ${r.p.numero}/${r.p.ano} — ${r.d.deputado.nome}`,
    description: doQueTrata(r.p).texto.slice(0, 200),
  };
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 border-t py-3 first:border-t-0 first:pt-0">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{rotulo}</dt>
      <dd className="text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

export default async function PaginaProjeto({ params }: Params) {
  const { id, projeto } = await params;
  const r = ler(id, projeto);
  if (!r) notFound();
  const { d, p } = r;
  const dep = d.deputado;
  const resumo = doQueTrata(p);
  const decide = quemDecide(p.apreciacao);
  const nome = `${p.sigla} ${p.numero}/${p.ano}`;

  return (
    <main id="conteudo" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <nav aria-label="Você está em" className="min-w-0 truncate text-sm text-muted-foreground">
          <Link href="/" className="text-muted-foreground">
            Início
          </Link>
          <span className="mx-1.5">/</span>
          <Link href={`/uf/${dep.uf.toLowerCase()}`} className="text-muted-foreground">
            {nomeUf(dep.uf)}
          </Link>
          <span className="mx-1.5">/</span>
          <Link href={`/deputado/${dep.id}`} className="text-muted-foreground">
            {dep.nome}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{nome}</span>
        </nav>
        <Voltar destino={`/deputado/${dep.id}#lista-projetos`} />
      </div>

      <header className="mb-8 max-w-3xl">
        {p.temas.length > 0 && (
          <ul className="mb-4 flex flex-wrap gap-2" aria-label="Área do projeto (temas da Câmara)">
            {p.temas.map((t) => (
              <li key={t}>
                <Badge className="bg-accent px-3 py-1 text-sm text-accent-foreground">{t}</Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm font-medium text-primary">
          {TIPO[p.sigla] ?? p.sigla} · {nome}
        </p>
        <h1 className="mt-1 text-xl leading-snug font-bold tracking-tight text-pretty sm:text-3xl">{resumo.texto}</h1>
        <p className="mt-2 text-xs text-muted-foreground">Texto: {resumo.origem.toLowerCase()}, sem reescrita.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Em que pé está?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-5 text-lg font-medium">{situacaoSimples(p.situacao)}</p>
              <EtapasProjeto estagio={p.estagio} />
              {p.apensado && (
                <p className="mt-5 rounded-lg border bg-muted px-3 py-2 text-sm">
                  Este projeto foi anexado a outro parecido e tramita junto com ele; a discussão pode seguir no projeto principal.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">O que diz a ementa oficial?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-pretty">{p.ementa}</p>
              {p.resumo && p.resumo.trim() !== p.ementa.trim() && resumo.origem !== 'Resumo da Câmara' && (
                <p className="mt-3 text-sm text-muted-foreground">{p.resumo}</p>
              )}
            </CardContent>
          </Card>

          {p.palavrasChave.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Quais palavras-chave a Câmara usou?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap gap-1.5">
                  {p.palavrasChave.map((k) => (
                    <li key={k}>
                      <Badge variante="outline" className="font-medium">
                        {k}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="text-lg">Ficha do projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <Linha rotulo="Autor">
                <Link href={`/deputado/${dep.id}`}>{dep.nome}</Link> ({dep.partido ? `${dep.partido}-${dep.uf}` : dep.uf})
              </Linha>
              <Linha rotulo="Apresentado em">{data(p.apresentadoEm)}</Linha>
              {decide && <Linha rotulo="Quem decide">{decide}</Linha>}
              {p.regime && <Linha rotulo="Regime de tramitação">{p.regime}</Linha>}
              {p.situacao && <Linha rotulo="Situação, como a Câmara escreve">{p.situacao}</Linha>}
            </dl>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className={`${botao('default')} mt-4 w-full`}>
              Ver na Câmara
              <Externo tamanho={16} />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
