// Dado bruto publicado de um deputado (DEC-07): o mesmo JSON que gerou a página, gerado no
// build (estático). Só GET (DEC-12).

import { lerArquivoPublicado, listarDeputados } from '../../../../lib/dados';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return listarDeputados().map((d) => ({ arquivo: `${d.id}.json` }));
}

export async function GET(_: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await params;
  const m = /^(\d{1,9})\.json$/.exec(arquivo);
  const conteudo = m ? lerArquivoPublicado(`deputados/${m[1]}.json`) : null;
  if (!conteudo) return new Response('não encontrado', { status: 404 });
  return new Response(conteudo, { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
