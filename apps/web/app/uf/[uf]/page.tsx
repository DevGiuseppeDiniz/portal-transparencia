import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ListaDeputados } from '../../../componentes/BuscaDeputado';
import { Badge } from '../../../componentes/ui';
import { UFS, listarDeputados, nomeUf } from '../../../lib/dados';

export const dynamicParams = false;

export function generateStaticParams() {
  return UFS.map((u) => ({ uf: u.sigla.toLowerCase() }));
}

type Params = { params: Promise<{ uf: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { uf } = await params;
  return { title: `Deputados federais — ${nomeUf(uf.toUpperCase())}` };
}

// Ordem alfabética: nunca ordenar por métrica (DEC-01, sem ranking).
export default async function DeputadosDaUf({ params }: Params) {
  const { uf } = await params;
  const sigla = uf.toUpperCase();
  if (!UFS.some((u) => u.sigla === sigla)) notFound();
  const deputados = listarDeputados().filter((d) => d.uf === sigla);

  return (
    <main id="conteudo" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Você está em" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="text-muted-foreground">
          Início
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/#estados" className="text-muted-foreground">
          Estados
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{nomeUf(sigla)}</span>
      </nav>
      <p className="text-sm font-medium text-primary">Bancada federal</p>
      <h1 className="font-bold tracking-tight">Deputados federais de {nomeUf(sigla)}</h1>
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge>{deputados.length} em exercício</Badge>
        <span>em ordem alfabética</span>
      </div>
      <ListaDeputados deputados={deputados} mostrarUf={false} />
    </main>
  );
}
