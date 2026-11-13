import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BuscaTopo } from '../componentes/BuscaTopo';
import { Marca } from '../componentes/Icones';
import { lerIndice } from '../lib/dados';
import { dataDeIso } from '../lib/formato';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Portal Parlamentar', template: '%s · Portal Parlamentar' },
  description: 'Dados públicos sobre deputados federais, com a fonte oficial de cada número.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const indice = lerIndice();
  return (
    <html lang="pt-BR">
      <body>
        <a className="pular" href="#conteudo">
          Pular para o conteúdo
        </a>
        <header className="topo">
          <div className="contido barra-topo">
            <Link className="marca" href="/">
              <Marca />
              Portal Parlamentar
            </Link>
            <nav className="nav-principal" aria-label="Principal">
              <Link href="/#estados">Estados</Link>
              <Link href="/metodo">Como calculamos</Link>
            </nav>
            <BuscaTopo />
          </div>
        </header>
        {children}
        <footer className="rodape">
          <div className="contido">
            <p className="marca">
              <Marca tamanho={24} />
              Portal Parlamentar
            </p>
            <p>
              Projeto independente, sem ligação com a Câmara dos Deputados ou com qualquer partido. Os dados vêm das fontes oficiais da Câmara;
              cada número tem o link para conferir.
            </p>
            <p>
              {indice ? <>Dados publicados em {dataDeIso(indice.geradoEm)}. </> : <>Ainda não há dados publicados. </>}
              <Link href="/metodo">Como calculamos</Link> · <Link href="/metodo#fontes">Fontes</Link> · <Link href="/metodo#erros">Encontrou um erro?</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
