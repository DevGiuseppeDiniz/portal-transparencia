'use client';

// Série mês a mês (barras empilhadas + linha de referência opcional). Usada na presença
// (dias presente / ausente com e sem justificativa) e na cota (gasto × valor-base).
// Cores neutras e sem semáforo (DSG-04): a parte do deputado em azul, o resto em cinzas.

import type { ReactNode } from 'react';
import { formatar, type Formato } from '../../lib/formato';
import { CORES, MolduraGrafico, useLargura, useSelecao } from './interacao';

export interface SerieDef {
  readonly chave: string;
  readonly nome: string;
  readonly cor: string;
}

export interface PontoMensal {
  readonly rotulo: string;
  readonly rotuloLongo: string;
  readonly valores: Readonly<Record<string, number>>;
  readonly linha?: number | null;
  /** Mês fora do recorte (ex.: fora do exercício): desenhado tracejado. */
  readonly inativo?: boolean;
  readonly dica: readonly string[];
}

const M = { esq: 56, dir: 8, topo: 12, base: 28 };

export function SerieMensal({
  titulo,
  series,
  pontos,
  formatoEixo,
  nomeLinha,
  instrucao,
  largura = 640,
  altura = 220,
}: {
  titulo: string;
  series: readonly SerieDef[];
  pontos: readonly PontoMensal[];
  formatoEixo: Formato;
  nomeLinha?: string;
  instrucao?: string;
  /** Proporção do SVG: use a largura aproximada (px) do espaço, para o texto sair em ~12 px. */
  largura?: number;
  altura?: number;
}) {
  const [caixa, L] = useLargura<HTMLDivElement>(largura);
  const A = altura;
  const { ativo, setAtivo, aoTeclar } = useSelecao(pontos.length);
  if (pontos.length === 0) return null;
  const total = (p: PontoMensal) => series.reduce((t, s) => t + (p.valores[s.chave] ?? 0), 0);
  const maxY = niceMax(Math.max(...pontos.map((p) => Math.max(total(p), p.linha ?? 0)), 1));
  const larg = (L - M.esq - M.dir) / pontos.length;
  const y = (v: number) => A - M.base - (v / maxY) * (A - M.topo - M.base);
  const xCentro = (i: number) => M.esq + i * larg + larg / 2;
  const marcasY = [0, maxY / 2, maxY];
  // Rótulos do eixo espaçados pela largura real (≈ 1 a cada 64 px).
  const cadaRotulo = Math.max(1, Math.ceil(pontos.length / Math.max(2, Math.floor((L - M.esq) / 64))));
  const p = ativo !== null ? pontos[ativo] : undefined;

  const linha = pontos.some((pt) => pt.linha != null)
    ? pontos
        .map((pt, i) => (pt.linha == null ? '' : `${i === 0 || pontos[i - 1]?.linha == null ? 'M' : 'L'}${M.esq + i * larg} ${y(pt.linha)}H${M.esq + (i + 1) * larg}`))
        .join('')
    : null;

  return (
    <MolduraGrafico
      titulo={titulo}
      instrucao={instrucao}
      ativo={ativo}
      aoTeclar={aoTeclar}
      aoSair={() => setAtivo(null)}
      posicaoDica={ativo !== null ? xCentro(ativo) / L : 0.5}
      dica={
        p && (
          <>
            <strong className="mb-0.5 block">{p.rotuloLongo}</strong>
            {p.dica.map((linhaDica) => (
              <span key={linhaDica} className="block text-muted-foreground">
                {linhaDica}
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
              <th scope="col">Mês</th>
              <th scope="col">Valores</th>
            </tr>
          </thead>
          <tbody>
            {pontos.map((pt) => (
              <tr key={pt.rotuloLongo}>
                <td>{pt.rotuloLongo}</td>
                <td>{pt.dica.join('; ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div ref={caixa}>
      <svg
        viewBox={`0 0 ${L} ${A}`}
        className="block h-auto w-full overflow-visible"
        aria-hidden="true"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.floor((((e.clientX - r.left) / r.width) * L - M.esq) / larg);
          setAtivo(i >= 0 && i < pontos.length ? i : null);
        }}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.floor((((e.clientX - r.left) / r.width) * L - M.esq) / larg);
          if (i >= 0 && i < pontos.length) setAtivo(i);
        }}
      >
        {marcasY.map((v) => (
          <g key={v}>
            <line x1={M.esq} x2={L - M.dir} y1={y(v)} y2={y(v)} stroke={v === 0 ? CORES.neutroForte : CORES.grade} />
            <text x={M.esq - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill={CORES.texto}>
              {formatar(formatoEixo, v)}
            </text>
          </g>
        ))}
        {pontos.map((pt, i) => {
          let acumulado = 0;
          const x0 = M.esq + i * larg;
          const w = Math.max(2, larg * 0.72);
          return (
            <g key={pt.rotuloLongo} opacity={ativo === null || ativo === i ? 1 : 0.55}>
              {ativo === i && <rect x={x0} y={M.topo} width={larg} height={A - M.topo - M.base} fill="#f4f4f5" />}
              {series.map((s) => {
                const v = pt.valores[s.chave] ?? 0;
                if (v <= 0) return null;
                const topo = y(acumulado + v);
                const base = y(acumulado);
                acumulado += v;
                return (
                  <rect
                    key={s.chave}
                    x={x0 + (larg - w) / 2}
                    y={topo}
                    width={w}
                    height={Math.max(0, base - topo)}
                    fill={pt.inativo ? '#ffffff' : s.cor}
                    stroke={pt.inativo ? CORES.neutroForte : 'none'}
                    strokeDasharray={pt.inativo ? '3 2' : undefined}
                  />
                );
              })}
              {i % cadaRotulo === 0 && (
                <text x={xCentro(i)} y={A - 8} textAnchor="middle" fontSize={12} fill={CORES.texto}>
                  {pt.rotulo}
                </text>
              )}
            </g>
          );
        })}
        {linha && <path d={linha} fill="none" stroke={CORES.referencia} strokeWidth={2} strokeDasharray="6 4" />}
      </svg>
      </div>
      <Legenda series={series} nomeLinha={linha ? nomeLinha : undefined} />
    </MolduraGrafico>
  );
}

function Legenda({ series, nomeLinha }: { series: readonly SerieDef[]; nomeLinha?: string | undefined }): ReactNode {
  return (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
      {series.map((s) => (
        <span key={s.chave} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: s.cor }} />
          {s.nome}
        </span>
      ))}
      {nomeLinha && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: CORES.referencia }} />
          {nomeLinha}
        </span>
      )}
    </div>
  );
}

function niceMax(v: number): number {
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
