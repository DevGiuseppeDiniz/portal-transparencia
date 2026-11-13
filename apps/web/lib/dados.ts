// Leitura do snapshot publicado (apps/ingest `publicar`). Só roda no servidor, no build:
// usa node:fs. O site não tem acesso ao banco (DEC-12, SEG-01).
//
// PORTAL_DADOS_DIR aponta o snapshot; sem ele, <repo>/data/publicado. Sem snapshot, o site
// é gerado vazio, com o aviso de que ainda não há dados publicados (DSG-10).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DeputadoPublicado, IndicePublicado, ResumoDeputado } from '@portal/metrics/publicacao';
import { VERSAO_PUBLICACAO } from '@portal/metrics/publicacao';

function raiz(): string {
  return process.env['PORTAL_DADOS_DIR'] ?? join(process.cwd(), '..', '..', 'data', 'publicado');
}

let indiceEmCache: IndicePublicado | null | undefined;

export function lerIndice(): IndicePublicado | null {
  if (indiceEmCache !== undefined) return indiceEmCache;
  const arquivo = join(raiz(), 'indice.json');
  if (!existsSync(arquivo)) return (indiceEmCache = null);
  const indice = JSON.parse(readFileSync(arquivo, 'utf8')) as IndicePublicado;
  if (indice.versao !== VERSAO_PUBLICACAO) {
    throw new Error(`snapshot na versão ${indice.versao}; o site espera ${VERSAO_PUBLICACAO}. Rode: pnpm coletar publicar`);
  }
  return (indiceEmCache = indice);
}

export function listarDeputados(): readonly ResumoDeputado[] {
  return lerIndice()?.deputados ?? [];
}

const ID_VALIDO = /^\d{1,9}$/;

export function lerDeputado(id: string): DeputadoPublicado | null {
  if (!ID_VALIDO.test(id)) return null;
  const relativo = join('deputados', `${id}.json`);
  if (!lerIndice()?.arquivos[relativo]) return null;
  return JSON.parse(readFileSync(join(raiz(), relativo), 'utf8')) as DeputadoPublicado;
}

/** Conteúdo exato do arquivo publicado (para servir como dado bruto, DEC-07). */
export function lerArquivoPublicado(relativo: 'indice.json' | `deputados/${string}.json`): string | null {
  if (relativo !== 'indice.json' && !lerIndice()?.arquivos[relativo]) return null;
  const arquivo = join(raiz(), relativo);
  return existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : null;
}

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

export function nomeUf(sigla: string): string {
  return UFS.find((u) => u.sigla === sigla)?.nome ?? sigla;
}
