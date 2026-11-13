import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BuscaTopo } from '../componentes/BuscaTopo';
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
          <div className="barra-topo">
            <Link className="marca" href="/">
              Portal Parlamentar
            </Link>
            <nav aria-label="Principal">
              <Link href="/">Encontrar deputado</Link>
              <Link href="/metodo">Como calculamos</Link>
            </nav>
            <BuscaTopo />
          </div>
        </header>
        <main id="conteudo">{children}</main>
        <footer className="rodape">
          <div>
            <p>
              Site independente, sem ligação com a Câmara dos Deputados ou com qualquer partido. Os dados vêm das
              fontes oficiais da Câmara; cada número tem o link para conferir.
            </p>
            <p>
              {indice ? <>Dados publicados em {dataDeIso(indice.geradoEm)}. </> : <>Ainda não há dados publicados. </>}
              <Link href="/metodo">Como calculamos e de onde vêm os dados</Link>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
