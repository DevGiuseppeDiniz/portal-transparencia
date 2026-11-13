// Página do deputado: as 3 métricas do MVP (DEC-11). Regras de conteúdo (05-design):
//   título = métrica + recorte + período, sem verbo nem adjetivo (DSG-05, REF-14);
//   valor absoluto primeiro, comparação logo depois, com a base nomeada (PRI-02);
//   posição como contagem real; distribuição inteira no gráfico; método e dado bruto a
//   1 clique (PRI-07, DEC-07). Sem "você", sem cor de bom/ruim (DSG-04).
// Visual: componentes no padrão shadcn/ui (DEC-14).

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import type { CotaPublicada, PresencaPublicada, ProjetosPublicados } from '@portal/metrics/publicacao';
import { Comparacao } from '../../../componentes/Comparacao';
import { Funil } from '../../../componentes/Funil';
import { Calendario, Carteira, Documento } from '../../../componentes/Icones';
import { Proveniencia } from '../../../componentes/Proveniencia';
import { Badge, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, botao, cn } from '../../../componentes/ui';
import { lerDeputado, listarDeputados, nomeUf } from '../../../lib/dados';
import { inteiro, mesAno, percentual, plural, reais } from '../../../lib/formato';

export const dynamicParams = false;

export function generateStaticParams() {
  return listarDeputados().map((d) => ({ id: String(d.id) }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const d = lerDeputado((await params).id);
  return d ? { title: d.deputado.nome, description: `Presença, cota e projetos de ${d.deputado.nome} (${d.deputado.uf}), com as fontes oficiais.` } : {};
}

export default async function PaginaDeputado({ params }: Params) {
  const { id } = await params;
  const dados = lerDeputado(id);
  if (!dados) notFound();
  const { deputado, presenca, cota, projetos } = dados;
  const linkDados = `/deputado/${deputado.id}/dados`;

  return (
    <main id="conteudo" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Você está em" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="text-muted-foreground">
          Início
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/uf/${deputado.uf.toLowerCase()}`} className="text-muted-foreground">
          {nomeUf(deputado.uf)}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{deputado.nome}</span>
      </nav>

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        {deputado.urlFoto && (
          <img
            src={deputado.urlFoto}
            alt={`Foto oficial de ${deputado.nome}`}
            width={104}
            height={104}
            className="size-26 shrink-0 rounded-full border-4 border-background bg-muted object-cover object-[center_15%] shadow-md"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">Deputado(a) federal</p>
          <h1 className="font-bold tracking-tight">{deputado.nome}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{deputado.partido ?? 'sem partido'}</Badge>
            <Badge>{nomeUf(deputado.uf)}</Badge>
            <Badge variante="outline">Em exercício</Badge>
          </div>
        </div>
        <a href={deputado.urlCamara} rel="noopener noreferrer" className={botao('outline')}>
          Página oficial na Câmara
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <SecaoPresenca p={presenca} linkDados={`${linkDados}#presenca`} />
        <SecaoCota c={cota} uf={deputado.uf} linkDados={`${linkDados}#cota`} />
        <SecaoProjetos j={projetos} linkDados={`${linkDados}#projetos`} />
      </div>
    </main>
  );
}

function Cabecalho({ id, icone, titulo, periodo }: { id: string; icone: ReactNode; titulo: string; periodo: string }) {
  return (
    <CardHeader className="flex-row items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">{icone}</span>
      <div>
        <CardTitle id={id}>{titulo}</CardTitle>
        <CardDescription>{periodo}</CardDescription>
      </div>
    </CardHeader>
  );
}

function Numero({ valor, complemento }: { valor: string; complemento: string }) {
  return (
    <p className="mb-3">
      <span className="block text-4xl font-bold tracking-tight">{valor}</span>
      <span className="text-sm text-muted-foreground">{complemento}</span>
    </p>
  );
}

function Aviso({ children }: { children: ReactNode }) {
  return <p className="my-3 rounded-lg border bg-muted px-3 py-2 text-sm">{children}</p>;
}

function Explicacao({ resumo, children }: { resumo: string; children: ReactNode }) {
  return (
    <details className="group mt-4 border-t pt-1 [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted-foreground">
      <summary className="flex min-h-11 list-none items-center gap-1.5 text-sm [&::-webkit-details-marker]:hidden">
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-open:rotate-90">
          <path d="m9 6 6 6-6 6" />
        </svg>
        {resumo}
      </summary>
      {children}
    </details>
  );
}

function SemDado({ titulo, id, icone, className }: { titulo: string; id: string; icone: ReactNode; className?: string }) {
  return (
    <Card aria-labelledby={id} className={className}>
      <Cabecalho id={id} icone={icone} titulo={titulo} periodo="Sem dado publicado" />
      <CardContent>
        <p className="text-sm text-muted-foreground">Sem dado publicado para esta métrica.</p>
      </CardContent>
    </Card>
  );
}

function SecaoPresenca({ p, linkDados }: { p: PresencaPublicada | null; linkDados: string }) {
  const titulo = 'Presença em sessões deliberativas do Plenário';
  if (!p) return <SemDado titulo={titulo} id="t-presenca" icone={<Calendario />} />;
  const periodo = `${mesAno(p.proveniencia.periodo.inicio)} a ${mesAno(p.proveniencia.periodo.fim)}`;
  return (
    <Card aria-labelledby="t-presenca">
      <Cabecalho id="t-presenca" icone={<Calendario />} titulo={titulo} periodo={periodo} />
      <CardContent>
        <Numero valor={percentual(p.taxa)} complemento={`dos dias de sessão (${inteiro(p.presencas)} de ${inteiro(p.dias)})`} />
        {p.referencia && (
          <p className="text-sm">
            Na Câmara, a mediana foi {percentual(p.referencia.mediana)}. Metade dos deputados ficou entre {percentual(p.referencia.p25)} e{' '}
            {percentual(p.referencia.p75)}.
            {p.posicao && p.entraNaReferencia && <> Presença maior que a de {inteiro(p.posicao.menores)} dos {inteiro(p.posicao.total)} deputados.</>}
          </p>
        )}
        {!p.entraNaReferencia && (
          <Aviso>
            Período curto: {plural(p.dias, 'dia')} de sessão em exercício, menos que os {p.minDiasReferencia} usados na comparação com a Câmara.
          </Aviso>
        )}
        <Comparacao
          titulo={`${titulo}, ${periodo}`}
          valor={p.taxa}
          referencia={p.referencia}
          valores={p.valoresReferencia}
          maximo={1}
          formatar={(v) => percentual(v)}
          rotuloDeputado="Deputado"
          rotuloReferencia="Câmara"
        />
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-muted-foreground">Ausências com justificativa</dt>
            <dd className="text-lg font-semibold">{plural(p.ausenciasJustificadas, 'dia')}</dd>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-muted-foreground">Ausências sem justificativa</dt>
            <dd className="text-lg font-semibold">{plural(p.ausenciasNaoJustificadas, 'dia')}</dd>
          </div>
        </dl>
        {p.justificativas.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Motivos: {p.justificativas.map((j) => `${j.motivo.toLowerCase()} (${j.dias})`).join(', ')}.
          </p>
        )}
        {p.presencasSemRegistroNaSessao > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Dias marcados “Presença (~)”: {inteiro(p.presencasSemRegistroNaSessao)}. A Câmara registra presença no dia, mas ausência na ata da
            sessão; a ata prevalece e esses dias não contam como presença.
          </p>
        )}
        <Explicacao resumo="Como esta conta é feita">
          <p>
            Dias com sessão deliberativa no Plenário da Câmara, só os dias em que o deputado estava em exercício. Ausência justificada (licença,
            missão autorizada) conta como ausência na porcentagem e aparece separada acima. Sessões conjuntas do Congresso não entram, por isso o
            total pode ser um pouco menor que o do site da Câmara. <Link href="/metodo#met-01">Método completo</Link>.
          </p>
        </Explicacao>
      </CardContent>
      <CardFooter>
        <Proveniencia p={p.proveniencia} linkDados={linkDados} />
      </CardFooter>
    </Card>
  );
}

function SecaoCota({ c, uf, linkDados }: { c: CotaPublicada | null; uf: string; linkDados: string }) {
  const titulo = 'Uso da cota para despesas do mandato';
  if (!c) return <SemDado titulo={titulo} id="t-cota" icone={<Carteira />} />;
  const periodo = `${mesAno(c.proveniencia.periodo.inicio)} a ${mesAno(c.proveniencia.periodo.fim)}`;
  const escala = Math.max(1.25, ...c.valoresReferenciaUf, c.percentual ?? 0);
  return (
    <Card aria-labelledby="t-cota">
      <Cabecalho id="t-cota" icone={<Carteira />} titulo={titulo} periodo={periodo} />
      <CardContent>
        <Numero valor={reais(c.gastoCentavos)} complemento={`em ${plural(c.mesesEmExercicio, 'mês', 'meses')} em exercício`} />
        <p className="text-sm">
          Equivale a {percentual(c.percentual)} do valor-base da cota de {nomeUf(uf)} no mesmo período ({reais(c.valorBaseCentavos)}).
          {c.referenciaUf && (
            <>
              {' '}
              Entre os {inteiro(c.referenciaUf.n)} deputados de {nomeUf(uf)}, a média foi {percentual(c.referenciaUf.media)} e a mediana,{' '}
              {percentual(c.referenciaUf.mediana)}.
            </>
          )}
        </p>
        {!c.entraNaReferencia && (
          <Aviso>
            Período curto: {plural(c.mesesEmExercicio, 'mês', 'meses')} em exercício, menos que os {c.minMesesReferencia} usados na comparação com o
            estado.
          </Aviso>
        )}
        <Comparacao
          titulo={`${titulo}, ${periodo}, em relação ao valor-base`}
          valor={c.percentual}
          referencia={c.referenciaUf}
          valores={c.valoresReferenciaUf}
          maximo={escala}
          formatar={(v) => percentual(v)}
          rotuloDeputado="Deputado"
          rotuloReferencia={uf}
        />
        <h3 className="mt-5 mb-2 text-sm font-semibold">Maiores categorias de gasto</h3>
        <ul className="divide-y rounded-lg border text-sm">
          {c.categorias.slice(0, 3).map((x) => (
            <li key={x.categoria} className="flex items-baseline justify-between gap-3 px-3 py-2">
              <span className="first-letter:uppercase">{x.categoria.replace(/\.$/, '').toLowerCase()}</span>
              <span className="shrink-0 font-medium tabular-nums">{reais(x.centavos)}</span>
            </li>
          ))}
        </ul>
        <Explicacao resumo="Por que o percentual pode passar de 100%">
          <p>
            O valor-base é o valor mensal da cota para o estado (Ato da Mesa 43/2009). A regra permite acumular o saldo não usado ao longo do ano, há
            adicionais para alguns cargos, e o que passar do saldo anual é descontado do salário do deputado. Por isso passar de 100% do valor-base
            não indica, por si, irregularidade. Gastar menos também não indica, por si, um mandato melhor.{' '}
            <Link href="/metodo#met-02">Método completo</Link>.
          </p>
        </Explicacao>
      </CardContent>
      <CardFooter>
        <Proveniencia p={c.proveniencia} linkDados={linkDados} />
      </CardFooter>
    </Card>
  );
}

function SecaoProjetos({ j, linkDados }: { j: ProjetosPublicados | null; linkDados: string }) {
  const titulo = 'Projetos de lei apresentados como autor principal';
  if (!j) return <SemDado titulo={titulo} id="t-projetos" icone={<Documento />} className="lg:col-span-2" />;
  const periodo = `Desde ${mesAno(j.proveniencia.periodo.inicio)}`;
  return (
    <Card aria-labelledby="t-projetos" className="lg:col-span-2">
      <Cabecalho id="t-projetos" icone={<Documento />} titulo={titulo} periodo={periodo} />
      <CardContent>
        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div>
            <Numero valor={inteiro(j.porEstagio.apresentada)} complemento={`apresentados · ${inteiro(j.porEstagio.lei)} viraram lei`} />
            <p className="text-sm">
              Na Câmara, {inteiro(j.referencia.deputadosComLei)} dos {inteiro(j.referencia.totalDeputados)} deputados em exercício tiveram ao menos
              um projeto próprio transformado em lei nesta legislatura.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-muted-foreground">Apensados a outro projeto</dt>
                <dd className="text-lg font-semibold">{inteiro(j.apensados)}</dd>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-muted-foreground">Arquivados, retirados ou devolvidos</dt>
                <dd className="text-lg font-semibold">{inteiro(j.arquivados + j.retirados + j.devolvidos)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">
              Projetos apensados tramitam junto com outro projeto, e o conteúdo pode seguir no projeto principal.
            </p>
          </div>
          <Funil projetos={j} />
        </div>
        <Explicacao resumo="O que esta contagem não mostra">
          <p>
            Conta só projetos de lei (PL, PLP e PEC) em que o deputado é o primeiro autor. Não mostra relatoria de projetos de outros deputados,
            emendas, fiscalização nem votos. Projetos recentes ainda não tiveram tempo de avançar. <Link href="/metodo#met-03">Método completo</Link>.
          </p>
        </Explicacao>
      </CardContent>
      <CardFooter className={cn()}>
        <Proveniencia p={j.proveniencia} linkDados={linkDados} />
      </CardFooter>
    </Card>
  );
}
