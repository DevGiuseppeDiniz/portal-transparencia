// Preparação dos dados dos gráficos (no servidor, no build): o navegador recebe só o que
// desenha. Funções puras.

import type { CotaPublicada, PresencaPublicada } from '@portal/metrics/publicacao';
import type { PontoMensal } from '../componentes/graficos/SerieMensal';
import { mesAno, plural, reais } from './formato';

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const rotuloCurto = (aaaamm: string) => `${MESES_CURTOS[Number(aaaamm.slice(5, 7)) - 1]}/${aaaamm.slice(2, 4)}`;

/** Presença mês a mês, a partir do dado bruto (cada dia de sessão). */
export function presencaPorMes(p: PresencaPublicada): PontoMensal[] {
  const meses = new Map<string, { presente: number; justificada: number; ausente: number; motivos: Map<string, number> }>();
  for (const d of p.diasDeSessao) {
    const m = d.data.slice(0, 7);
    const r = meses.get(m) ?? { presente: 0, justificada: 0, ausente: 0, motivos: new Map() };
    if (d.frequencia === 'Presença') r.presente++;
    else if (d.frequencia === 'Ausência justificada') {
      r.justificada++;
      const motivo = (d.justificativa ?? 'sem motivo informado').toLowerCase();
      r.motivos.set(motivo, (r.motivos.get(motivo) ?? 0) + 1);
    } else r.ausente++; // "Ausência" e "Presença (~)" (ata prevalece; MET-01)
    meses.set(m, r);
  }
  return [...meses]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, r]) => {
      const total = r.presente + r.justificada + r.ausente;
      const dica = [`Presente em ${r.presente} de ${plural(total, 'dia')} de sessão`];
      if (r.justificada) dica.push(`Ausência justificada: ${plural(r.justificada, 'dia')} (${[...r.motivos].map(([k, v]) => `${k}: ${v}`).join('; ')})`);
      if (r.ausente) dica.push(`Ausência sem justificativa: ${plural(r.ausente, 'dia')}`);
      return {
        rotulo: rotuloCurto(m),
        rotuloLongo: mesAno(m),
        valores: { presente: r.presente, justificada: r.justificada, ausente: r.ausente },
        dica,
      };
    });
}

/** Cota mês a mês: gasto (barra) × valor-base do mês (linha). */
export function cotaPorMes(c: CotaPublicada): PontoMensal[] {
  return c.porMes.map((m) => ({
    rotulo: rotuloCurto(m.mes),
    rotuloLongo: mesAno(m.mes),
    valores: { gasto: m.gastoCentavos / 100 },
    linha: m.valorBaseCentavos / 100,
    inativo: !m.emExercicio,
    dica: [
      `Gasto: ${reais(m.gastoCentavos)}`,
      `Valor-base do mês: ${reais(m.valorBaseCentavos)}`,
      ...(m.emExercicio ? [] : ['Fora do exercício: não entra no total']),
    ],
  }));
}
