// Índice leve para a busca do topo: só id, nome, estado e partido (sem hashes nem fotos).
// Estático, gerado no build; só GET (DEC-12).

import { listarDeputados } from '../../../lib/dados';

export const dynamic = 'force-static';

export function GET() {
  const deputados = listarDeputados().map((d) => ({ id: d.id, nome: d.nome, uf: d.uf, partido: d.partido }));
  return Response.json(deputados, { headers: { 'cache-control': 'public, max-age=3600' } });
}
