// Funil legislativo (MET-03) como tabela com barras alinhadas à esquerda (DSG-02): uma linha
// por estágio, a barra do deputado e a mediana da Câmara na mesma escala. Tabela de verdade:
// serve de equivalente acessível do gráfico (WCAG 1.3.1).

import type { ProjetosPublicados } from '@portal/metrics/publicacao';
import type { EstagioFunil } from '@portal/metrics';
import { inteiro } from '../lib/formato';

export const NOMES_ESTAGIO: Record<EstagioFunil, string> = {
  apresentada: 'Apresentados',
  comissao: 'Receberam parecer em comissão',
  alem_comissao: 'Passaram das comissões',
  aprovada_camara: 'Aprovados na Câmara',
  lei: 'Viraram lei',
};

const ORDEM: readonly EstagioFunil[] = ['apresentada', 'comissao', 'alem_comissao', 'aprovada_camara', 'lei'];

export function Funil({ projetos }: { projetos: ProjetosPublicados }) {
  const maximo = Math.max(1, ...ORDEM.map((e) => Math.max(projetos.porEstagio[e], projetos.referencia.porEstagio[e]?.mediana ?? 0)));
  const largura = (v: number) => `${Math.max(0, (v / maximo) * 100) * 0.55}%`;
  return (
    <div className="overflow-x-auto">
      <table className="tabela">
        <caption>Projetos por estágio alcançado</caption>
        <thead>
          <tr>
            <th scope="col">Estágio</th>
            <th scope="col">Deputado</th>
            <th scope="col">Mediana Câmara</th>
          </tr>
        </thead>
        <tbody>
          {ORDEM.map((e) => {
            const valor = projetos.porEstagio[e];
            const mediana = projetos.referencia.porEstagio[e]?.mediana ?? null;
            return (
              <tr key={e}>
                <th scope="row" className="!text-sm !font-medium !normal-case !tracking-normal text-foreground">{NOMES_ESTAGIO[e]}</th>
                <td className="min-w-24 tabular-nums">
                  <span className="mr-2 inline-block h-2.5 min-w-0.5 rounded-sm bg-deputado align-middle" style={{ width: largura(valor) }} aria-hidden="true" />
                  {inteiro(valor)}
                </td>
                <td className="min-w-24 tabular-nums">
                  {mediana === null ? (
                    'sem dado'
                  ) : (
                    <>
                      <span className="mr-2 inline-block h-2.5 min-w-0.5 rounded-sm bg-referencia align-middle" style={{ width: largura(mediana) }} aria-hidden="true" />
                      {mediana.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">Cada estágio inclui os projetos que foram além dele.</p>
    </div>
  );
}
