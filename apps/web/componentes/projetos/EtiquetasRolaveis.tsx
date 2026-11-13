'use client';

// Linha de etiquetas (temas) que rola para o lado sem barra de rolagem: esmaece na ponta
// onde há mais etiquetas escondidas, mostra setas nessa ponta (só em quem tem mouse) e aceita
// a roda do mouse. A roda só é "capturada" enquanto ainda há para onde rolar; nas pontas, a
// página volta a rolar normalmente. Clique fora das setas leva a `href` (a linha inteira é
// um link). As setas não entram na ordem do Tab: todas as etiquetas estão na página do projeto.

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const ESMAECER = '1.75rem';

function Seta({ lado, aoClicar }: { lado: 'esquerda' | 'direita'; aoClicar: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      onClick={(e) => {
        e.stopPropagation();
        aoClicar();
      }}
      className={`absolute top-1/2 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-accent [@media(hover:hover)]:grid ${
        lado === 'esquerda' ? 'left-0' : 'right-0'
      }`}
    >
      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d={lado === 'esquerda' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </svg>
    </button>
  );
}

export function EtiquetasRolaveis({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [mais, setMais] = useState({ antes: false, depois: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const antes = el.scrollLeft > 1;
      const depois = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setMais((m) => (m.antes === antes && m.depois === depois ? m : { antes, depois }));
    };
    // Roda vertical vira rolagem lateral enquanto houver para onde ir (listener não passivo
    // para poder impedir a rolagem da página).
    const roda = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // trackpad lateral: nativo
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const vai = e.deltaY > 0 ? el.scrollLeft < max - 1 : el.scrollLeft > 1;
      if (!vai) return;
      e.preventDefault();
      el.scrollLeft += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    el.addEventListener('scroll', medir, { passive: true });
    el.addEventListener('wheel', roda, { passive: false });
    return () => {
      obs.disconnect();
      el.removeEventListener('scroll', medir);
      el.removeEventListener('wheel', roda);
    };
  }, []);

  const passo = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: 'smooth' });
  const mascara = `linear-gradient(90deg, ${mais.antes ? `transparent, #000 ${ESMAECER}` : '#000'}, ${mais.depois ? `#000 calc(100% - ${ESMAECER}), transparent` : '#000'})`;

  return (
    <div className="relative z-10 min-w-0" onClick={() => router.push(href)}>
      <div
        ref={ref}
        className="flex cursor-pointer gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: mascara, WebkitMaskImage: mascara }}
      >
        {children}
      </div>
      {mais.antes && <Seta lado="esquerda" aoClicar={() => passo(-1)} />}
      {mais.depois && <Seta lado="direita" aoClicar={() => passo(1)} />}
    </div>
  );
}
