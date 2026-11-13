// Quem é cada ponto dos gráficos de posição (nome, partido, UF e valor). Estático; o navegador
// só baixa quando o gráfico é explorado e reaproveita em todas as páginas. Só GET (DEC-12).

import { lerArquivoPublicado } from '../../../lib/dados';

export const dynamic = 'force-static';

export function GET() {
  const conteudo = lerArquivoPublicado('referencias.json');
  if (!conteudo) return new Response('[]', { status: 404 });
  return new Response(conteudo, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
