'use client';

// Filtro em botão com lista de opções e contagem: padrão "faceted filter" da tabela de dados
// do shadcn/ui (Popover + Command), sem a biblioteca. Escolha única (GOV.UK/DWP: escolha
// única = radio), com busca dentro quando há muitas opções. Teclado: setas, Home/End, Enter,
// Esc fecha e devolve o foco ao botão. A lista flutua em position: fixed para nunca ser
// cortada por um contêiner com rolagem.

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../ui';

export interface Opcao {
  readonly valor: string;
  readonly rotulo: string;
  readonly contagem?: number | undefined;
}

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function FiltroOpcoes({
  rotulo,
  valor,
  opcoes,
  aoMudar,
  icone,
  comBusca = false,
  semFiltro = 'Todos',
  alinhar = 'esquerda',
  modo = 'filtro',
}: {
  rotulo: string;
  valor: string;
  opcoes: readonly Opcao[];
  aoMudar: (valor: string) => void;
  icone?: ReactNode;
  comBusca?: boolean;
  /** Rótulo da opção "sem filtro" (valor vazio). */
  semFiltro?: string;
  alinhar?: 'esquerda' | 'direita';
  /** 'ordem': sempre há um valor escolhido e não existe a opção vazia. */
  modo?: 'filtro' | 'ordem';
}) {
  const id = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const caixaRef = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const todas: readonly Opcao[] = modo === 'filtro' ? [{ valor: '', rotulo: semFiltro }, ...opcoes] : opcoes;
  const visiveis = busca ? todas.filter((o) => o.valor && normalizar(o.rotulo).includes(normalizar(busca))) : todas;
  const escolhida = opcoes.find((o) => o.valor === valor);
  const ativo = modo === 'filtro' && Boolean(valor);

  const posicionar = () => {
    const b = botaoRef.current?.getBoundingClientRect();
    if (!b) return;
    const width = Math.min(288, window.innerWidth - 16);
    const preferida = alinhar === 'direita' ? b.right - width : b.left;
    setPos({ top: b.bottom + 6, left: Math.max(8, Math.min(preferida, window.innerWidth - width - 8)), width });
  };

  useLayoutEffect(() => {
    if (!aberto) return;
    posicionar();
    // Foco no campo de busca ou na opção escolhida.
    const alvo =
      caixaRef.current?.querySelector<HTMLElement>('input') ??
      caixaRef.current?.querySelector<HTMLElement>('[aria-checked="true"]') ??
      caixaRef.current?.querySelector<HTMLElement>('[role="menuitemradio"]');
    alvo?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!caixaRef.current?.contains(t) && !botaoRef.current?.contains(t)) setAberto(false);
    };
    const mover = () => posicionar();
    document.addEventListener('pointerdown', fora);
    window.addEventListener('scroll', mover, true);
    window.addEventListener('resize', mover);
    return () => {
      document.removeEventListener('pointerdown', fora);
      window.removeEventListener('scroll', mover, true);
      window.removeEventListener('resize', mover);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const fechar = (devolverFoco = true) => {
    setAberto(false);
    setBusca('');
    if (devolverFoco) botaoRef.current?.focus();
  };
  const escolher = (v: string) => {
    aoMudar(v);
    fechar();
  };

  const teclas = (e: React.KeyboardEvent) => {
    const itens = [...(caixaRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
    const atual = itens.indexOf(document.activeElement as HTMLElement);
    const ir = (i: number) => itens[Math.max(0, Math.min(itens.length - 1, i))]?.focus();
    if (e.key === 'Escape') {
      e.preventDefault();
      fechar();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      ir(atual + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (atual <= 0) caixaRef.current?.querySelector<HTMLElement>('input')?.focus();
      else ir(atual - 1);
    } else if (e.key === 'Home' && atual >= 0) {
      e.preventDefault();
      ir(0);
    } else if (e.key === 'End' && atual >= 0) {
      e.preventDefault();
      ir(itens.length - 1);
    } else if (e.key === 'Tab') {
      fechar(false);
    }
  };

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? `${id}-menu` : undefined}
        onClick={() => (aberto ? fechar() : setAberto(true))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !aberto) {
            e.preventDefault();
            setAberto(true);
          }
        }}
        className={cn(
          'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium whitespace-nowrap shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground',
          modo === 'filtro' && !ativo && 'border-dashed border-input bg-background',
          ativo && 'border-primary/40 bg-accent text-accent-foreground',
          modo === 'ordem' && 'border-input bg-background',
        )}
      >
        {icone}
        {modo === 'ordem' ? (
          <span>
            <span className="text-muted-foreground">{rotulo}: </span>
            {escolhida?.rotulo}
          </span>
        ) : ativo ? (
          <>
            <span>{rotulo}</span>
            <span className="h-4 w-px bg-primary/30" aria-hidden="true" />
            <span className="max-w-40 truncate rounded bg-background px-1.5 py-0.5 text-xs font-semibold text-primary">{escolhida?.rotulo}</span>
          </>
        ) : (
          <span>{rotulo}</span>
        )}
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" className="opacity-60">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {aberto && pos && (
        <div
          ref={caixaRef}
          onKeyDown={teclas}
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          className="fixed z-50 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
        >
          {comBusca && (
            <div className="border-b p-1.5">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={`Procurar ${rotulo.toLowerCase()}…`}
                aria-label={`Procurar ${rotulo.toLowerCase()}`}
                className="h-9 w-full rounded-md bg-transparent px-2 text-base outline-none placeholder:text-muted-foreground md:text-sm"
              />
            </div>
          )}
          <div id={`${id}-menu`} role="menu" aria-label={rotulo} className="max-h-72 overflow-y-auto p-1">
            {visiveis.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">Nada encontrado.</p>}
            {visiveis.map((o) => {
              const marcado = o.valor === valor;
              return (
                <button
                  key={o.valor || '_todos'}
                  type="button"
                  role="menuitemradio"
                  aria-checked={marcado}
                  tabIndex={-1}
                  onClick={() => escolher(o.valor)}
                  className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-2 text-left leading-snug text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
                    {marcado && (
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className={cn('flex-1', marcado && 'font-semibold')}>{o.rotulo}</span>
                  {o.contagem !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{o.contagem.toLocaleString('pt-BR')}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
