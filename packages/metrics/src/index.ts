// Cálculo das métricas (docs/04-metricas.md). Funções puras: recebem dados já
// normalizados e devolvem o valor + a referência de comparação (PRI-02). Sem I/O.

/** Mediana de uma lista de números. Lista vazia devolve null (dado faltante ≠ zero, DSG-10). */
export function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  const centro = ordenados[meio]!;
  return ordenados.length % 2 === 0 ? (ordenados[meio - 1]! + centro) / 2 : centro;
}
