// Formatação em pt-BR. Funções puras, usadas no servidor e no cliente.

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function percentual(valor: number | null, casas = 0): string {
  if (valor === null) return 'sem dado';
  if (Math.abs(valor) < 1e-9) valor = 0; // nunca "-0%"
  return `${(valor * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}

export function reais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function inteiro(n: number): string {
  return n.toLocaleString('pt-BR');
}

/** '2025-03-02' → '02/03/2025' */
export function data(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** '2025-08' ou '2025-08-01' → 'ago/2025' */
export function mesAno(iso: string): string {
  const [a, m] = iso.split('-');
  return `${MESES[Number(m) - 1]}/${a}`;
}

/** ISO com hora → '13/11/2026' */
export function dataDeIso(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/** "1 dia" / "3 dias" */
export function plural(n: number, singular: string, pluralForma = `${singular}s`): string {
  return `${inteiro(n)} ${n === 1 ? singular : pluralForma}`;
}

/** Formatos nomeados: componentes de cliente recebem o NOME (serializável), não a função. */
export type Formato = 'percentual' | 'reais' | 'centavos' | 'inteiro' | 'decimal' | 'reaisMil';

export function formatar(formato: Formato, v: number): string {
  switch (formato) {
    case 'percentual':
      return percentual(v);
    case 'reais':
      return (v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    case 'centavos':
      return reais(v);
    case 'inteiro':
      return inteiro(Math.round(v));
    case 'decimal':
      return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    case 'reaisMil':
      return v >= 1000 ? `R$ ${inteiro(Math.round(v / 1000))} mil` : `R$ ${inteiro(Math.round(v))}`;
  }
}
