// Ícones em SVG inline (traço 2 px, 24×24, estilo "outline"), sem biblioteca: decorativos,
// sempre aria-hidden (o texto ao lado dá o significado).

import type { ReactNode } from 'react';

function Icone({ children, tamanho = 20, className }: { children: ReactNode; tamanho?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const Lupa = (p: { tamanho?: number; className?: string }) => (
  <Icone {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icone>
);
export const Calendario = (p: { tamanho?: number }) => (
  <Icone {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </Icone>
);
export const Carteira = (p: { tamanho?: number }) => (
  <Icone {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h12v4" />
    <path d="M3 7v11a2 2 0 0 0 2 2h14V9H5a2 2 0 0 1-2-2Z" />
    <circle cx="16" cy="14.5" r="1" />
  </Icone>
);
export const Documento = (p: { tamanho?: number }) => (
  <Icone {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </Icone>
);
export const Pessoa = (p: { tamanho?: number }) => (
  <Icone {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icone>
);
export const Pino = (p: { tamanho?: number }) => (
  <Icone {...p}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icone>
);
export const Pagina = (p: { tamanho?: number }) => (
  <Icone {...p}>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </Icone>
);
export const Seta = (p: { tamanho?: number }) => (
  <Icone {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icone>
);

/** Marca: colunas de um plenário estilizado, sem nenhum símbolo oficial. */
export const Marca = ({ tamanho = 28 }: { tamanho?: number }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <rect width="32" height="32" rx="8" fill="#4338ca" />
    <path d="M8 23h16M9 21V13m4.67 8v-8m4.66 8v-8M23 21V13M7 12l9-5 9 5Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
