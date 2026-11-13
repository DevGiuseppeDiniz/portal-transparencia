// Formatação em pt-BR. Funções puras, usadas no servidor e no cliente.

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Percentual em pt-BR. Nunca arredonda para 100% o que não é 100%, nem para 0% o que não é
 * zero: nesses limites usa as casas decimais necessárias (392 de 393 dias = "99,7%", não
 * "100%"). Arredondar para a borda faria o número contradizer os detalhes ao lado dele.
 */
export function percentual(valor: number | null, casas = 0): string {
  if (valor === null) return 'sem dado';
  if (Math.abs(valor) < 1e-9) valor = 0; // nunca "-0%"
  const fmt = (c: number) => (valor! * 100).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  let c = casas;
  const naBorda = (texto: string) => {
    const n = Number(texto.replace(/\./g, '').replace(',', '.'));
    return (n === 100 && valor! < 1) || (n === 0 && valor! > 0) || (n === -0 && valor! < 0);
  };
  while (c < 4 && naBorda(fmt(c))) c++;
  return `${fmt(c)}%`;
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

/**
 * Frase de posição que considera EMPATES. `iguais` inclui o próprio deputado (a lista de
 * valores do grupo contém ele). Ex.: com 100% e outros 21 em 100%, não dizer "maior que 490".
 */
export function frasePosicao(
  pos: { menores: number; iguais: number; total: number },
  textos: { maiorQue: string; nenhumAcima: string; valor: string; nenhumAbaixo?: string },
): string {
  const outrosIguais = pos.iguais - 1;
  const maiores = pos.total - pos.menores - pos.iguais;
  if (maiores === 0) {
    return outrosIguais > 0
      ? `${textos.nenhumAcima}: outros ${inteiro(outrosIguais)} também têm ${textos.valor}.`
      : `${textos.nenhumAcima} entre os outros ${inteiro(pos.total - 1)}.`;
  }
  // "maior que a de 0" não se lê: quem está na ponta de baixo ganha a frase pelo outro lado.
  if (pos.menores === 0 && textos.nenhumAbaixo) {
    return outrosIguais > 0
      ? `${textos.nenhumAbaixo}: outros ${inteiro(outrosIguais)} também têm ${textos.valor}.`
      : `${textos.nenhumAbaixo} entre os outros ${inteiro(pos.total - 1)}.`;
  }
  const empate = outrosIguais > 0 ? ` e igual à de outros ${inteiro(outrosIguais)}` : '';
  return `${textos.maiorQue} ${inteiro(pos.menores)} dos ${inteiro(pos.total)} deputados${empate}.`;
}
