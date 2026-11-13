// Gráfico de comparação de uma métrica (DSG-02, DSG-03, DSG-04):
//   - posição numa escala comum (REF-17), eixo começando em zero, mesma escala para todos;
//   - a distribuição inteira (um traço claro por deputado), não só a mediana: uma referência
//     isolada vira norma implícita (pareceres REF-09/10/13/15, 2026-11-13);
//   - deputado = ponto cheio azul; mediana = traço cinza escuro (forma diferente, não só cor; REF-19);
//   - rótulo direto no gráfico, sem a sigla "P25–P75" (pareceres REF-17/REF-19 de 2026-11-13);
//   - tabela equivalente para leitor de tela (WCAG 1.1.1 / 1.3.1).

import type { DistribuicaoPublicada } from '@portal/metrics/publicacao';

interface Props {
  readonly titulo: string;
  readonly valor: number | null;
  readonly referencia: DistribuicaoPublicada | null;
  /** Valor de cada deputado da referência. */
  readonly valores: readonly number[];
  /** Fim da escala (o início é sempre zero). */
  readonly maximo: number;
  readonly formatar: (v: number) => string;
  readonly rotuloDeputado: string;
  readonly rotuloReferencia: string;
}

const LARGURA = 320;
const MARGEM = 12;

export function Comparacao({ titulo, valor, referencia, valores, maximo, formatar, rotuloDeputado, rotuloReferencia }: Props) {
  const x = (v: number) => MARGEM + (Math.min(Math.max(v, 0), maximo) / maximo) * (LARGURA - 2 * MARGEM);
  // Marcas redondas (0, 50%, 100%) e o fim da escala, se passar disso.
  const marcas = [...[0, 0.5, 1].filter((m) => m <= maximo), ...(maximo > 1 ? [maximo] : [])];

  return (
    <figure className="my-4">
      <svg className="block h-auto w-full overflow-visible" viewBox={`0 0 ${LARGURA} 80`} role="img" aria-label={titulo}>
        {/* eixo */}
        <line x1={MARGEM} x2={LARGURA - MARGEM} y1={44} y2={44} stroke="#8a8a85" strokeWidth={1} />
        {marcas.map((m) => (
          <g key={m}>
            <line x1={x(m)} x2={x(m)} y1={44} y2={58} stroke="#8a8a85" />
            <text x={x(m)} y={72} fontSize={12} textAnchor={m === 0 ? 'start' : m === maximo ? 'end' : 'middle'} fill="#4a4a4a">
              {formatar(m)}
            </text>
          </g>
        ))}
        {/* cada deputado da referência */}
        {/* um só <path> com todos os traços: 512 elementos pesariam ~100 KB na página */}
        {valores.length > 0 && (
          <path d={valores.map((v) => `M${x(v).toFixed(1)} 36v16`).join('')} stroke="#85857f" strokeWidth={0.6} fill="none" />
        )}
        {referencia && (
          <line x1={x(referencia.mediana)} x2={x(referencia.mediana)} y1={32} y2={55} stroke="#595959" strokeWidth={3} />
        )}
        {valor !== null && (
          <>
            <circle cx={x(valor)} cy={44} r={7} fill="#0072b2" stroke="#ffffff" strokeWidth={2} />
            <text x={x(valor)} y={20} fontSize={13} fontWeight={600} textAnchor={valor / maximo > 0.8 ? 'end' : valor / maximo < 0.2 ? 'start' : 'middle'} fill="#0b4f7c">
              {rotuloDeputado}: {formatar(valor)}
            </text>
          </>
        )}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-deputado" aria-hidden="true" />
          {rotuloDeputado}
        </span>
        {referencia && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-referencia" aria-hidden="true" />
            Mediana ({rotuloReferencia})
          </span>
        )}
        {valores.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-distribuicao" aria-hidden="true" />
            Cada traço claro: um deputado ({rotuloReferencia})
          </span>
        )}
      </figcaption>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <tbody>
          <tr>
            <th scope="row">{rotuloDeputado}</th>
            <td>{valor === null ? 'sem dado' : formatar(valor)}</td>
          </tr>
          {referencia && (
            <>
              <tr>
                <th scope="row">Mediana ({rotuloReferencia})</th>
                <td>{formatar(referencia.mediana)}</td>
              </tr>
              <tr>
                <th scope="row">Metade dos deputados ({rotuloReferencia}) fica entre</th>
                <td>
                  {formatar(referencia.p25)} e {formatar(referencia.p75)}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </figure>
  );
}
