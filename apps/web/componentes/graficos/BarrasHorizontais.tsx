'use client';

// Barras horizontais com rótulo em cima (cabe no celular), o valor do deputado em azul e,
// quando houver, a referência como marcador na MESMA escala (DSG-02). Uso: funil de projetos
// (deputado × mediana da Câmara) e categorias de gasto.

import { formatar as formatarValor, type Formato } from '../../lib/formato';
import { CORES, MolduraGrafico, useSelecao } from './interacao';

export interface ItemBarra {
  readonly rotulo: string;
  readonly valor: number;
  readonly referencia?: number | null;
  readonly dica: readonly string[];
}

export function BarrasHorizontais({
  titulo,
  itens,
  formato,
  nomeValor,
  nomeReferencia,
}: {
  titulo: string;
  itens: readonly ItemBarra[];
  formato: Formato;
  nomeValor: string;
  nomeReferencia?: string;
}) {
  const { ativo, setAtivo, aoTeclar } = useSelecao(itens.length);
  const formatar = (v: number) => formatarValor(formato, v);
  const max = Math.max(...itens.map((i) => Math.max(i.valor, i.referencia ?? 0)), 1);
  const pct = (v: number) => `${(v / max) * 100}%`;
  const item = ativo !== null ? itens[ativo] : undefined;

  return (
    <MolduraGrafico
      titulo={titulo}
      ativo={ativo}
      aoTeclar={aoTeclar}
      aoSair={() => setAtivo(null)}
      posicaoDica={0.5}
      dicaNoTopo={false}
      dica={
        item && (
          <>
            <strong className="mb-0.5 block">{item.rotulo}</strong>
            {item.dica.map((d) => (
              <span key={d} className="block text-muted-foreground">
                {d}
              </span>
            ))}
          </>
        )
      }
      tabela={
        <table>
          <caption>{titulo}</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">{nomeValor}</th>
              {nomeReferencia && <th scope="col">{nomeReferencia}</th>}
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.rotulo}>
                <td>{i.rotulo}</td>
                <td>{formatar(i.valor)}</td>
                {nomeReferencia && <td>{i.referencia == null ? 'sem dado' : formatar(i.referencia)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ul className="space-y-1" aria-hidden="true">
        {itens.map((i, k) => (
          <li
            key={i.rotulo}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setAtivo(k)}
            onPointerDown={() => setAtivo(k)}
            className={`rounded-md px-2 py-1.5 transition-colors ${ativo === k ? 'bg-muted' : ''}`}
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate first-letter:uppercase">{i.rotulo}</span>
              <span className="shrink-0 font-semibold tabular-nums">{formatar(i.valor)}</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-background">
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: pct(i.valor), minWidth: i.valor > 0 ? 3 : 0, background: CORES.deputado }} />
              {i.referencia != null && (
                <div className="absolute -inset-y-1 w-0.5 rounded-full" style={{ left: `calc(${pct(i.referencia)} - 1px)`, background: CORES.referencia }} />
              )}
            </div>
            {ativo === k && (
              <p className="mt-1.5 text-xs text-muted-foreground">{i.dica.join(' · ')}</p>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-2 text-xs text-muted-foreground" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: CORES.deputado }} />
          {nomeValor}
        </span>
        {nomeReferencia && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-0.5" style={{ background: CORES.referencia }} />
            {nomeReferencia}
          </span>
        )}
      </div>
    </MolduraGrafico>
  );
}
