// Índice publicado: deputados em exercício e o SHA-256 de cada arquivo (DEC-07). Só GET.

import { lerArquivoPublicado } from '../../../lib/dados';

export const dynamic = 'force-static';

export function GET() {
  const conteudo = lerArquivoPublicado('indice.json');
  if (!conteudo) return new Response('ainda não há dados publicados', { status: 404 });
  return new Response(conteudo, { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
