import { BuscaDeputado } from '../componentes/BuscaDeputado';
import { SeletorEstado } from '../componentes/SeletorEstado';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../componentes/ui';
import { UFS, lerIndice, listarDeputados } from '../lib/dados';
import { dataDeIso } from '../lib/formato';

// Home: 1º busca pelo nome (o que a maioria procura, REF-08/REF-33); 2º escolha do estado com
// busca de estado acima do mapa e a lista ao lado. Visão geral → detalhe (DSG-01).
export default function Inicio() {
  const deputados = listarDeputados();
  const indice = lerIndice();
  const porUf = new Map<string, number>();
  for (const d of deputados) porUf.set(d.uf, (porUf.get(d.uf) ?? 0) + 1);
  const estados = UFS.map((u) => ({ ...u, deputados: porUf.get(u.sigla) ?? 0 }));

  return (
    <main id="conteudo">
      <section aria-labelledby="titulo-inicio" className="border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
          <Badge variante="outline" className="mb-4 bg-background">
            Câmara dos Deputados · dados públicos
          </Badge>
          <h1 id="titulo-inicio" className="max-w-3xl font-bold tracking-tight text-balance">
            Encontre seu deputado federal
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">
            Presença nas sessões, uso da cota para despesas do mandato e projetos de lei de cada deputado em exercício, com a fonte oficial de
            cada número. Sem nota e sem ranking.
          </p>
          {deputados.length > 0 && (
            <div id="nome" className="mt-8 max-w-2xl">
              <BuscaDeputado deputados={deputados.map(({ id, nome, partido, uf, urlFoto }) => ({ id, nome, partido, uf, urlFoto }))} />
            </div>
          )}
          <ul aria-label="Sobre os dados" className="mt-6 flex flex-wrap gap-2">
            <li>
              <Badge>{deputados.length} deputados em exercício</Badge>
            </li>
            <li>
              <Badge>27 estados</Badge>
            </li>
            {indice && (
              <li>
                <Badge>Atualizado em {dataDeIso(indice.geradoEm)}</Badge>
              </li>
            )}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {deputados.length === 0 ? (
          <p className="rounded-lg border bg-muted p-4">Ainda não há dados publicados.</p>
        ) : (
          <Card id="estados" aria-labelledby="titulo-estados">
            <CardHeader>
              <CardTitle id="titulo-estados" className="text-2xl">
                Ou escolha pelo estado
              </CardTitle>
              <CardDescription className="text-base">Cada estado elege uma bancada de deputados federais. Veja quem representa o seu.</CardDescription>
            </CardHeader>
            <CardContent>
              <SeletorEstado estados={estados} />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
