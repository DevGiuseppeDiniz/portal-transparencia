// Unidades da federação (módulo sem I/O: usado também no navegador).

export const UFS: ReadonlyArray<{ sigla: string; nome: string }> = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' },
];

/** Artigo/preposição de cada estado ("do Paraná", "da Bahia", "de São Paulo"). */
const PREPOSICAO: Readonly<Record<string, 'do' | 'da' | 'de'>> = {
  AC: 'do', AL: 'de', AP: 'do', AM: 'do', BA: 'da', CE: 'do', DF: 'do', ES: 'do', GO: 'de', MA: 'do',
  MT: 'de', MS: 'de', MG: 'de', PA: 'do', PB: 'da', PR: 'do', PE: 'de', PI: 'do', RJ: 'do', RN: 'do',
  RS: 'do', RO: 'de', RR: 'de', SC: 'de', SP: 'de', SE: 'de', TO: 'do',
};

/** "do Paraná", "da Bahia", "de São Paulo". */
export function doEstado(sigla: string): string {
  const uf = UFS.find((u) => u.sigla === sigla);
  return uf ? `${PREPOSICAO[sigla] ?? 'de'} ${uf.nome}` : sigla;
}
