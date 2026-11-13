'use client';

// Ao chegar numa página com #âncora (ex.: clique em outro deputado no gráfico de posição),
// rola até o mesmo gráfico e o destaca por alguns segundos, para a comparação continuar de
// onde parou. Respeita "reduzir movimento" (sem rolagem suave nem animação).

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function DestaqueAncora() {
  const caminho = usePathname();
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'center' });
    el.classList.add('destaque-ancora');
    const foco = el.querySelector<HTMLElement>('[role=group]');
    foco?.focus({ preventScroll: true });
    const t = window.setTimeout(() => el.classList.remove('destaque-ancora'), 2600);
    return () => window.clearTimeout(t);
  }, [caminho]);
  return null;
}
