// Ponto de entrada dos coletores (11-arquitetura). Roda como job agendado, sem porta HTTP
// (SEG-03). Node 24 executa TypeScript direto (type stripping), sem etapa de build.
//
// Esqueleto: só lista as fontes conhecidas. O primeiro coletor (SRC-01, deputados) vem no
// próximo PR, gravando na tabela `coleta` (DEC-10).

import { FONTES } from '@portal/sources';
import type { Coleta } from '@portal/db';

const pendentes: Array<Pick<Coleta, 'fonteId'>> = FONTES.map((f) => ({ fonteId: f.id }));

console.log(`ingest: ${pendentes.length} fonte(s) catalogada(s); nenhum coletor implementado ainda.`);
