import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BuscaTopo } from '../componentes/BuscaTopo';
import { Marca } from '../componentes/Icones';
import { RastreioNavegacao } from '../componentes/RastreioNavegacao';
import { botao } from '../componentes/ui';
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
      <body className="min-h-screen bg-background">
        <RastreioNavegacao />
        <a
          href="#conteudo"
          className="sr-only rounded-md bg-background px-4 py-2 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        >
          Pular para o conteúdo
        </a>
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="faixa-brasil" aria-hidden="true" />
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 md:h-16 md:flex-nowrap md:py-0">
            <Link href="/" className="flex items-center gap-2 font-semibold text-foreground hover:no-underline">
              <Marca />
              <span>Portal Parlamentar</span>
            </Link>
            <nav aria-label="Principal" className="ml-2 hidden items-center gap-1 md:flex">
              <Link href="/#estados" className={botao('ghost', 'sm')}>
                Estados
              </Link>
              <Link href="/metodo" className={botao('ghost', 'sm')}>
                Como calculamos
              </Link>
            </nav>
            <BuscaTopo />
          </div>
        </header>
        {children}
        <footer className="border-t bg-[#001a4f] text-blue-100">
          <div className="faixa-brasil" aria-hidden="true" />
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:px-6 md:grid-cols-[2fr_1fr]">
            <div className="space-y-3">
              <p className="flex items-center gap-2 font-semibold text-white">
                <Marca tamanho={24} />
                Portal Parlamentar
              </p>
              <p className="max-w-prose">
                Projeto independente, sem ligação com a Câmara dos Deputados ou com qualquer partido. Os dados vêm das fontes oficiais da Câmara; cada
                número tem o link para conferir.
              </p>
              <p className="text-blue-200">{indice ? `Dados publicados em ${dataDeIso(indice.geradoEm)}.` : 'Ainda não há dados publicados.'}</p>
            </div>
            <nav aria-label="Rodapé" className="flex flex-col gap-2 md:items-end">
              <Link href="/metodo" className="text-white">
                Como calculamos
              </Link>
              <Link href="/metodo#fontes" className="text-white">
                Fontes oficiais
              </Link>
              <Link href="/metodo#erros" className="text-white">
                Encontrou um erro?
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
