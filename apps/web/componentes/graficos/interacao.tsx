'use client';

// Interação comum dos gráficos, no padrão de projetos de dados (Our World in Data, NYT, FT):
//   - mouse: passar por cima seleciona e mostra a dica (tooltip) junto do elemento;
//   - toque: tocar seleciona; a dica fica no alto do gráfico, nunca embaixo do dedo;
//   - teclado: o gráfico é focável; setas ←/→ (ou ↑/↓) percorrem, Home/End vão às pontas,
//     Esc limpa; a leitura é anunciada (aria-live). Nada depende só do hover (WCAG 1.4.13, 2.1.1).

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';

/**
 * Largura real do contêiner, em px (ResizeObserver). O SVG é desenhado nessa largura, então o
 * texto tem sempre o mesmo tamanho em qualquer tela, como nas bibliotecas de gráficos
 * responsivos. No build (sem navegador) usa `padrao`.
 */
export function useLargura<T extends HTMLElement>(padrao: number): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState(padrao);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setLargura(w);
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, largura];
}

export function useSelecao(total: number) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const aoTeclar = useCallback(
    (e: KeyboardEvent) => {
      if (total === 0) return;
      const mover = (n: number) => {
        e.preventDefault();
        setAtivo(Math.max(0, Math.min(total - 1, n)));
      };
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') mover((ativo ?? -1) + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') mover((ativo ?? total) - 1);
      else if (e.key === 'Home') mover(0);
      else if (e.key === 'End') mover(total - 1);
      else if (e.key === 'Escape') setAtivo(null);
    },
    [ativo, total],
  );
  return { ativo, setAtivo, aoTeclar };
}

/**
 * Moldura do gráfico: área focável com rótulo, dica posicionada e anúncio para leitor de tela.
 * `posicaoDica` é a fração horizontal (0–1) onde a dica deve apontar.
 */
export function MolduraGrafico({
  titulo,
  instrucao,
  ativo,
  dica,
  posicaoDica,
  aoTeclar,
  aoSair,
  children,
  tabela,
  dicaNoTopo = true,
}: {
  /** false: o próprio gráfico mostra a dica junto do item (ex.: barras horizontais). */
  dicaNoTopo?: boolean;
  titulo: string;
  instrucao?: string | undefined;
  ativo: number | null;
  dica: ReactNode;
  posicaoDica: number;
  aoTeclar: (e: KeyboardEvent) => void;
  aoSair: () => void;
  children: ReactNode;
  tabela: ReactNode;
}) {
  const id = useId();
  const caixa = useRef<HTMLDivElement>(null);
  // A dica fica centralizada no elemento e, perto das bordas, encosta do lado de dentro:
  // mede a própria largura e nunca é cortada.
  const pos = Math.min(Math.max(posicaoDica, 0), 1);
  const balao = useRef<HTMLDivElement>(null);
  const [esquerdaPx, setEsquerdaPx] = useState(0);
  useLayoutEffect(() => {
    const c = caixa.current;
    const b = balao.current;
    if (!c || !b) return;
    const largura = c.clientWidth;
    const w = b.offsetWidth;
    setEsquerdaPx(Math.max(0, Math.min(largura - w, pos * largura - w / 2)));
  }, [pos, ativo, dica]);
  return (
    <figure className="m-0">
      <div
        ref={caixa}
        role="group"
        tabIndex={0}
        aria-label={titulo}
        aria-describedby={`${id}-inst`}
        onKeyDown={aoTeclar}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') aoSair();
        }}
        onBlur={(e) => {
          if (!caixa.current?.contains(e.relatedTarget as Node)) aoSair();
        }}
        className={`relative touch-pan-y overflow-x-clip rounded-lg pt-1 select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring`}
      >
        {/* Dica: flutua logo acima do gráfico (por cima do texto, sem reservar espaço vazio),
            acompanhando o elemento na horizontal. */}
        {dicaNoTopo && (
        <div
          ref={balao}
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-full z-20 mb-1 w-max max-w-[min(18rem,100%)] rounded-lg border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-lg transition-opacity ${ativo === null ? 'opacity-0' : 'opacity-100'}`}
          style={{ left: esquerdaPx }}
        >
          {dica}
        </div>
        )}
        {children}
      </div>
      <p id={`${id}-inst`} className="mt-2 text-xs text-muted-foreground">
        {instrucao ?? 'Passe o mouse, toque ou use as setas para ver cada valor.'}
      </p>
      <p className="sr-only" aria-live="polite">
        {ativo !== null ? dica : ''}
      </p>
      {/* sr-only num div: numa <table> ele não segura a largura e a página estouraria. */}
      <div className="sr-only">{tabela}</div>
    </figure>
  );
}

/** Índice do elemento sob o ponteiro, a partir da posição horizontal no SVG. */
export function indicePorX(evento: React.PointerEvent<SVGSVGElement>, inicio: number, fim: number, larguraTotal: number, total: number): number | null {
  const caixa = evento.currentTarget.getBoundingClientRect();
  const x = ((evento.clientX - caixa.left) / caixa.width) * larguraTotal;
  if (x < inicio || x > fim) return null;
  return Math.max(0, Math.min(total - 1, Math.floor(((x - inicio) / (fim - inicio)) * total)));
}

export { CORES } from './cores';
