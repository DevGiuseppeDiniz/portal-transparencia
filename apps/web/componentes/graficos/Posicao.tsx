'use client';

// "Onde o deputado está entre os demais": cada deputado do grupo é um traço (ou ponto, em
// grupos pequenos) numa escala comum que começa em zero (DSG-02, REF-17); o deputado é o ponto
// grande e rotulado; a mediana, um traço escuro; a metade do meio, uma faixa suave.
// A frase de valor vem antes do gráfico (o gráfico confirma, não precisa ser decifrado).
// Interação: mouse, toque ou setas percorrem os deputados do grupo; a dica mostra quem é
// (nome, partido, UF), o valor e quantos ficam abaixo. Clique (ou Enter) abre a página dele.
// Os nomes vêm de /dados/referencias.json, baixado só na primeira interação (cache do
// navegador entre páginas). Nenhuma lista é ordenada por métrica (DEC-01).

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PontoReferencia, ReferenciasPublicadas } from '@portal/metrics/publicacao';
import { formatar as formatarValor, type Formato } from '../../lib/formato';
import { CORES } from './cores';
import { MolduraGrafico, useLargura, useSelecao } from './interacao';

const M = { esq: 16, dir: 16, topo: 50, base: 34 };

export function Posicao({
  titulo,
  valores,
  valor,
  mediana,
  p25,
  p75,
  maximo,
  formato,
  nomeGrupo,
  nomeMetrica,
  grupo,
  largura = 640,
  altura = 170,
}: {
  titulo: string;
  /** Valores de todos os deputados do grupo (inclui o deputado). */
  valores: readonly number[];
  valor: number | null;
  mediana: number | null;
  p25: number | null;
  p75: number | null;
  maximo: number;
  formato: Formato;
  /** Ex.: "deputados da Câmara", "deputados do Amapá". */
  nomeGrupo: string;
  /** Ex.: "presença", "do valor-base". */
  nomeMetrica: string;
  /** De onde vêm os nomes: a presença da Câmara ou a cota de uma UF. */
  grupo: { readonly metrica: 'presenca' } | { readonly metrica: 'cota'; readonly uf: string };
  largura?: number;
  altura?: number;
}) {
  const router = useRouter();
  const [pessoas, setPessoas] = useState<readonly PontoReferencia[] | null>(null);
  const [pedido, setPedido] = useState(false);
  const carregarNomes = () => {
    if (pedido) return;
    setPedido(true);
    fetch('/dados/referencias.json')
      .then((r) => (r.ok ? (r.json() as Promise<ReferenciasPublicadas>) : null))
      .then((ref) => {
        if (!ref) return;
        const lista = grupo.metrica === 'presenca' ? ref.presenca : (ref.cotaPorUf[grupo.uf] ?? []);
        // Só usa os nomes se a lista bate com os valores desta página (mesmo cálculo publicado).
        if (lista.length === valores.length) setPessoas(lista);
      })
      .catch(() => {});
  };
  const ordenados = pessoas ? pessoas.map((p) => p.valor) : [...valores].sort((a, b) => a - b);
  const { ativo, setAtivo, aoTeclar } = useSelecao(ordenados.length);
  const [caixa, L] = useLargura<HTMLDivElement>(largura);
  const A = altura;
  const fmt = (v: number) => formatarValor(formato, v);
  const x = (v: number) => M.esq + (Math.min(Math.max(v, 0), maximo) / maximo) * (L - M.esq - M.dir);
  const yEixo = A - M.base;
  const pontos = ordenados.length <= 40;
  const marcas = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].filter((m) => m <= maximo + 1e-9);

  // Em grupos pequenos, pontos empilhados quando coincidem.
  const pilha = new Map<number, number>();
  const posPonto = ordenados.map((v) => {
    const chave = Math.round(x(v) / 14);
    const k = pilha.get(chave) ?? 0;
    pilha.set(chave, k + 1);
    return { cx: x(v), cy: yEixo - 12 - k * 18 };
  });

  const maisProximo = (px: number) => {
    let melhor = 0;
    let dist = Infinity;
    ordenados.forEach((v, i) => {
      const d = Math.abs(x(v) - px);
      if (d < dist) {
        dist = d;
        melhor = i;
      }
    });
    return melhor;
  };

  const v = ativo !== null ? ordenados[ativo] : undefined;
  const pessoa = ativo !== null ? pessoas?.[ativo] : undefined;
  const abaixo = v === undefined ? 0 : ordenados.filter((o) => o < v).length;
  const abrir = (i: number | null) => {
    const alvo = i !== null ? pessoas?.[i] : undefined;
    if (alvo) router.push(`/deputado/${alvo.id}`);
  };

  return (
    <MolduraGrafico
      titulo={titulo}
      instrucao={`Passe o mouse, toque ou use as setas para ver cada um dos ${ordenados.length} ${nomeGrupo}; clique ou tecle Enter para abrir a página do deputado.`}
      ativo={ativo}
      aoTeclar={(e) => {
        carregarNomes();
        if (e.key === 'Enter') abrir(ativo);
        else aoTeclar(e);
      }}
      aoSair={() => setAtivo(null)}
      posicaoDica={v !== undefined ? x(v) / L : 0.5}
      dica={
        v !== undefined && (
          <>
            {pessoa ? (
              <strong className="block">
                {pessoa.nome} <span className="font-normal text-muted-foreground">({pessoa.partido ?? 'sem partido'}-{pessoa.uf})</span>
                <span className="block">
                  {fmt(v)} {nomeMetrica}
                </span>
              </strong>
            ) : (
              <strong className="block">
                Um deputado com {fmt(v)} {nomeMetrica}
              </strong>
            )}
            <span className="block text-muted-foreground">
              {abaixo} dos {ordenados.length} {nomeGrupo} ficam abaixo
            </span>
          </>
        )
      }
      tabela={
        <table>
          <caption>{titulo}</caption>
          <tbody>
            <tr>
              <th scope="row">Este deputado</th>
              <td>{valor === null ? 'sem dado' : fmt(valor)}</td>
            </tr>
            {mediana !== null && (
              <tr>
                <th scope="row">Mediana dos {nomeGrupo}</th>
                <td>{fmt(mediana)}</td>
              </tr>
            )}
            {p25 !== null && p75 !== null && (
              <tr>
                <th scope="row">Metade dos {nomeGrupo} fica entre</th>
                <td>
                  {fmt(p25)} e {fmt(p75)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      }
    >
      <div ref={caixa}>
      <svg
        viewBox={`0 0 ${L} ${A}`}
        className="block h-auto w-full overflow-visible"
        aria-hidden="true"
        onPointerEnter={carregarNomes}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setAtivo(maisProximo(((e.clientX - r.left) / r.width) * L));
        }}
        onPointerDown={(e) => {
          carregarNomes();
          const r = e.currentTarget.getBoundingClientRect();
          setAtivo(maisProximo(((e.clientX - r.left) / r.width) * L));
        }}
        onClick={(e) => {
          // Mouse: clique abre a página do deputado. Toque: só seleciona (a dica aparece).
          if ((e.nativeEvent as PointerEvent).pointerType === 'mouse') abrir(ativo);
        }}
        style={{ cursor: pessoas ? 'pointer' : undefined }}
      >
        {p25 !== null && p75 !== null && (
          <g>
            <rect x={x(p25)} y={M.topo - 4} width={Math.max(2, x(p75) - x(p25))} height={yEixo - M.topo + 4} rx={6} fill="#e3e8f2" />
          </g>
        )}
        <line x1={M.esq} x2={L - M.dir} y1={yEixo} y2={yEixo} stroke={CORES.neutroForte} />
        {marcas.map((m) => (
          <g key={m}>
            <line x1={x(m)} x2={x(m)} y1={yEixo} y2={yEixo + 5} stroke={CORES.neutroForte} />
            <text x={x(m)} y={A - 10} textAnchor={m === 0 ? 'start' : m === maximo ? 'end' : 'middle'} fontSize={12} fill={CORES.texto}>
              {fmt(m)}
            </text>
          </g>
        ))}

        {pontos ? (
          posPonto.map((p, i) => (
            <circle key={i} cx={p.cx} cy={p.cy} r={ativo === i ? 8 : 7} fill={ativo === i ? CORES.neutroForte : CORES.neutro} stroke="#fff" strokeWidth={1.5} />
          ))
        ) : (
          <path d={ordenados.map((o) => `M${x(o).toFixed(1)} ${M.topo}V${yEixo - 2}`).join('')} stroke={CORES.neutroForte} strokeOpacity={0.55} strokeWidth={1} />
        )}
        {!pontos && v !== undefined && <line x1={x(v)} x2={x(v)} y1={M.topo} y2={yEixo} stroke={CORES.texto} strokeWidth={2} />}

        {mediana !== null && (
          <g>
            <line x1={x(mediana)} x2={x(mediana)} y1={M.topo - 12} y2={yEixo} stroke={CORES.referencia} strokeWidth={3} />
            <text x={x(mediana)} y={M.topo - 17} textAnchor={x(mediana) > L * 0.85 ? 'end' : 'middle'} fontSize={12} fontWeight={600} fill={CORES.referencia}>
              mediana {fmt(mediana)}
            </text>
          </g>
        )}
        {valor !== null && (
          <g>
            <circle cx={x(valor)} cy={pontos ? yEixo - 12 : (M.topo + yEixo) / 2 + 4} r={11} fill={CORES.deputado} stroke="#fff" strokeWidth={3} />
            <text
              x={x(valor)}
              y={14}
              textAnchor={x(valor) > L * 0.8 ? 'end' : x(valor) < L * 0.2 ? 'start' : 'middle'}
              fontSize={14}
              fontWeight={700}
              fill={CORES.deputado}
            >
              Este deputado: {fmt(valor)}
            </text>
          </g>
        )}
      </svg>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: CORES.deputado }} />
          Este deputado
        </span>
        <span className="inline-flex items-center gap-1.5">
          {pontos ? <span className="size-2.5 rounded-full" style={{ background: CORES.neutro }} /> : <span className="h-3 w-px" style={{ background: CORES.neutroForte }} />}
          {pontos ? 'Cada ponto: um deputado' : 'Cada traço: um deputado'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5" style={{ background: CORES.referencia }} />
          Mediana
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm" style={{ background: '#e3e8f2' }} />
          Metade dos deputados
        </span>
      </div>
    </MolduraGrafico>
  );
}
