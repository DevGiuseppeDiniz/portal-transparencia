'use client';

// Botão "Voltar" no topo das páginas internas: volta no histórico quando a pessoa veio de
// dentro do portal; se chegou direto (link compartilhado, busca), vai para `destino`.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CHAVE_NAVEGOU } from './RastreioNavegacao';
import { botao } from './ui';

export function Voltar({ destino, rotulo = 'Voltar' }: { destino: string; rotulo?: string }) {
  const router = useRouter();
  return (
    <Link
      href={destino}
      className={`${botao('ghost', 'sm')} -mr-3 shrink-0`}
      onClick={(e) => {
        let navegouAqui = false;
        try {
          navegouAqui = sessionStorage.getItem(CHAVE_NAVEGOU) === '1';
        } catch {
          navegouAqui = false;
        }
        const veioDoPortal = navegouAqui || document.referrer.startsWith(window.location.origin);
        if (veioDoPortal && window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      {rotulo}
    </Link>
  );
}
