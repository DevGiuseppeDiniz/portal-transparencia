import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
    <>
      <p className="pequeno">
        <Link href="/">Início</Link>
      </p>
      <h1>Deputados federais em exercício — {nomeUf(sigla)}</h1>
      <p className="suave">{deputados.length} deputado(s), em ordem alfabética.</p>
      <ul className="lista-deputados em-grade">
        {deputados.map((d) => (
          <li key={d.id}>
            <Link href={`/deputado/${d.id}`}>
              {d.urlFoto && <img src={d.urlFoto} alt="" width={44} height={58} loading="lazy" />}
              <span>
                <strong>{d.nome}</strong>
                <br />
                <span className="pequeno suave">{d.partido ?? 'sem partido'}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
