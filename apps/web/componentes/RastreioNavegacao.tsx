'use client';

// Marca na sessão que a pessoa já navegou dentro do portal: o botão "Voltar" usa isso para
// decidir entre voltar no histórico e ir para a página de destino. (Na navegação interna do
// Next, document.referrer não muda, então não serve.) Nada sai do navegador.

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export const CHAVE_NAVEGOU = 'portal:navegou';

export function RastreioNavegacao() {
  const caminho = usePathname();
  const primeiro = useRef(true);
  useEffect(() => {
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    try {
      sessionStorage.setItem(CHAVE_NAVEGOU, '1');
    } catch {
      /* armazenamento bloqueado: o Voltar usa o destino */
    }
  }, [caminho]);
  return null;
}
