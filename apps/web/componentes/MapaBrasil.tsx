'use client';

// Mapa do Brasil para ESCOLHER o estado (navegação). Não codifica nenhuma métrica: todos os
// estados têm a mesma cor (DSG-04; sem cor de partido, REF-15).
// Acessibilidade (WCAG 2.2): cada estado é um link focável com nome acessível (1.1.1, 2.1.1),
// realce também no foco do teclado, não só no hover (1.4.13), e o mapa nunca é a única forma
// de escolher: a lista de estados continua ao lado (estados pequenos são difíceis no toque).

import Link from 'next/link';
import { ALTURA_MAPA, GEOMETRIA_UF, LARGURA_MAPA } from './mapa-brasil-geometria';

/**
 * Estados pequenos demais para tocar no celular (WCAG 2.5.8): rótulo fora do mapa, com linha
 * até o estado, e o rótulo faz parte do link (área de toque ≥ 44 px na tela). O DF ganha uma
 * área de toque circular invisível. Coordenadas no sistema do mapa (largura 1000).
 */
const ROTULO_EXTERNO: Readonly<Record<string, { x: number; y: number }>> = {
  RN: { x: 1075, y: 255 },
  PB: { x: 1075, y: 312 },
  PE: { x: 1075, y: 369 },
  AL: { x: 1075, y: 426 },
  SE: { x: 1075, y: 483 },
  ES: { x: 1000, y: 625 },
  RJ: { x: 960, y: 720 },
};
const ROTULO_DESLOCADO: Readonly<Record<string, { x: number; y: number }>> = {
  GO: { x: 595, y: 585 },
};
const RAIO_TOQUE_DF = 26;

interface Props {
  readonly estados: ReadonlyArray<{ readonly sigla: string; readonly nome: string; readonly deputados: number }>;
  /** Estado realçado (controlado pelo seletor: hover, foco ou busca). */
  readonly ativo: string | null;
  readonly aoAtivar: (sigla: string | null) => void;
}

export function MapaBrasil({ estados, ativo, aoAtivar }: Props) {
  const setAtivo = (f: string | null | ((a: string | null) => string | null)) => aoAtivar(typeof f === 'function' ? f(ativo) : f);
  // Estados com área de toque extra são desenhados por último, para ficarem por cima dos vizinhos.
  const pequeno = (sigla: string) => sigla === 'DF' || sigla in ROTULO_EXTERNO;
  const ordem = [...estados].sort((a, b) => Number(pequeno(a.sigla)) - Number(pequeno(b.sigla)));

  return (
    <figure className="m-0">
      <svg viewBox={`-4 -4 ${LARGURA_MAPA + 130} ${ALTURA_MAPA + 8}`} className="mapa-svg block h-auto max-h-[32rem] w-full" aria-label="Mapa do Brasil: escolha um estado">
        {ordem.map((e) => {
          const g = GEOMETRIA_UF[e.sigla];
          if (!g) return null;
          const externo = ROTULO_EXTERNO[e.sigla];
          const rotulo = externo ?? ROTULO_DESLOCADO[e.sigla] ?? { x: g.cx, y: g.cy };
          return (
            <Link
              key={e.sigla}
              href={`/uf/${e.sigla.toLowerCase()}`}
              aria-label={`${e.nome}: ${e.deputados} deputados`}
              className={ativo === e.sigla ? 'uf ativo' : 'uf'}
              onMouseEnter={() => setAtivo(e.sigla)}
              onMouseLeave={() => setAtivo((a) => (a === e.sigla ? null : a))}
              onFocus={() => setAtivo(e.sigla)}
              onBlur={() => setAtivo((a) => (a === e.sigla ? null : a))}
            >
              <path d={g.d} />
              {e.sigla === 'DF' && <circle className="toque" cx={g.cx} cy={g.cy} r={RAIO_TOQUE_DF} />}
              {externo && (
                <>
                  <line className="guia" x1={g.cx} y1={g.cy} x2={externo.x - 30} y2={externo.y} />
                  <rect className="toque" x={externo.x - 30} y={externo.y - 26} width={64} height={52} rx={8} />
                </>
              )}
              <text x={rotulo.x} y={rotulo.y} className={`sigla${externo ? ' externa' : ''}`} aria-hidden="true">
                {e.sigla}
              </text>
            </Link>
          );
        })}
      </svg>
    </figure>
  );
}
