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
import { NOMES_ESTAGIO } from '../../../componentes/Funil';
import { BarrasHorizontais } from '../../../componentes/graficos/BarrasHorizontais';
import { Posicao } from '../../../componentes/graficos/Posicao';
import { SerieMensal } from '../../../componentes/graficos/SerieMensal';
import { CORES } from '../../../componentes/graficos/cores';
import { Calendario, Carteira, Documento, Externo } from '../../../componentes/Icones';
import { DestaqueAncora } from '../../../componentes/DestaqueAncora';
import { Proveniencia } from '../../../componentes/Proveniencia';
import { ListaProjetos } from '../../../componentes/projetos/ListaProjetos';
import { Voltar } from '../../../componentes/Voltar';
import { Badge, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, botao, cn } from '../../../componentes/ui';
import { doEstado, lerDeputado, listarDeputados, nomeUf } from '../../../lib/dados';
import { frasePosicao, inteiro, mesAno, percentual, plural, reais } from '../../../lib/formato';
import { cotaPorMes, presencaPorMes } from '../../../lib/graficos';
import type { EstagioFunil } from '@portal/metrics';

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
    <main id="conteudo" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <DestaqueAncora />
      <div className="mb-6 flex items-center justify-between gap-4">
        <nav aria-label="Você está em" className="min-w-0 truncate text-sm text-muted-foreground">
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
        <Voltar destino={`/uf/${deputado.uf.toLowerCase()}`} />
      </div>

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
        <a href={deputado.urlCamara} target="_blank" rel="noopener noreferrer" className={botao('default')}>
          Página oficial na Câmara
          <Externo tamanho={16} />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </div>

      <div className="grid gap-6">
        <SecaoPresenca p={presenca} linkDados={`${linkDados}#presenca`} />
        <SecaoCota c={cota} uf={deputado.uf} linkDados={`${linkDados}#cota`} />
        <SecaoProjetos j={projetos} linkDados={`${linkDados}#projetos`} idDeputado={deputado.id} />
      </div>
    </main>
  );
}

function Cabecalho({ id, icone, titulo, periodo }: { id: string; icone: ReactNode; titulo: string; periodo: string }) {
  return (
    <CardHeader className="flex-row items-start gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">{icone}</span>
      <div>
        <CardTitle id={id} className="text-xl sm:text-2xl">{titulo}</CardTitle>
        <CardDescription>{periodo}</CardDescription>
      </div>
    </CardHeader>
  );
}

function Numero({ valor, complemento }: { valor: string; complemento: string }) {
  return (
    <p className="mb-3">
      <span className="block text-4xl font-bold tracking-tight sm:text-5xl">{valor}</span>
      <span className="text-sm text-muted-foreground">{complemento}</span>
    </p>
  );
}

function Indicador({ rotulo, valor, marcador }: { rotulo: string; valor: string; marcador?: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {marcador && <span className="size-2.5 shrink-0 rounded-sm" style={{ background: marcador }} aria-hidden="true" />}
        {rotulo}
      </dt>
      <dd className="text-lg font-semibold tabular-nums">{valor}</dd>
    </div>
  );
}

/** Introdução de cada gráfico em forma de pergunta (a pergunta que o gráfico responde). */
function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="mb-1 text-lg font-semibold tracking-tight sm:text-xl">{children}</h3>;
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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
          <div>
            <Numero valor={percentual(p.taxa)} complemento={`dos dias de sessão (${inteiro(p.presencas)} de ${inteiro(p.dias)})`} />
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <Indicador rotulo="Ausências com justificativa" valor={plural(p.ausenciasJustificadas, 'dia')} marcador={CORES.ausenciaJustificada} />
              <Indicador rotulo="Ausências sem justificativa" valor={plural(p.ausenciasNaoJustificadas, 'dia')} marcador={CORES.ausenciaSemJustificativa} />
            </dl>
            {p.justificativas.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Motivos: {p.justificativas.map((j) => `${j.motivo.toLowerCase()} (${j.dias})`).join(', ')}.
              </p>
            )}
            {!p.entraNaReferencia && (
              <Aviso>
                Período curto: {plural(p.dias, 'dia')} de sessão em exercício, menos que os {p.minDiasReferencia} usados na comparação com a Câmara.
              </Aviso>
            )}
          </div>
          {p.referencia && (
            <div id="posicao-presenca" className="scroll-mt-28 p-1">
              <Subtitulo>Onde está entre os {inteiro(p.referencia.n)} deputados da Câmara?</Subtitulo>
              <p className="mb-1 text-base">
                {p.posicao && p.entraNaReferencia ? (
                  <>
                    <strong className="font-semibold">
                      {frasePosicao(p.posicao, { maiorQue: 'Presença maior que a de', nenhumAcima: 'Nenhum deputado tem presença maior', valor: percentual(p.taxa) })}
                    </strong>{' '}
                  </>
                ) : null}
                <span className="text-muted-foreground">
                  A mediana da Câmara é {percentual(p.referencia.mediana)}; metade dos deputados fica entre {percentual(p.referencia.p25)} e{' '}
                  {percentual(p.referencia.p75)}.
                </span>
              </p>
              <Posicao
                titulo={`Presença deste deputado entre os ${inteiro(p.referencia.n)} deputados da Câmara, ${periodo}`}
                valores={p.valoresReferencia}
                valor={p.taxa}
                mediana={p.referencia.mediana}
                p25={p.referencia.p25}
                p75={p.referencia.p75}
                maximo={1}
                formato="percentual"
                nomeGrupo="deputados da Câmara"
                nomeMetrica="de presença"
                grupo={{ metrica: 'presenca' }}
                ancora="posicao-presenca"
                largura={680}
                altura={180}
              />
            </div>
          )}
        </div>
        <div className="mt-10">
          <Subtitulo>Como foi a presença mês a mês?</Subtitulo>
          <SerieMensal
            titulo={`Dias de sessão por mês, ${periodo}`}
            series={[
              { chave: 'presente', nome: 'Presente', cor: CORES.deputado },
              { chave: 'justificada', nome: 'Ausência justificada', cor: CORES.ausenciaJustificada },
              { chave: 'ausente', nome: 'Ausência sem justificativa', cor: CORES.ausenciaSemJustificativa },
            ]}
            pontos={presencaPorMes(p)}
            formatoEixo="inteiro"
            largura={1050}
            altura={240}
          />
        </div>
        {p.presencasSemRegistroNaSessao > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Dias marcados “Presença (~)”: {inteiro(p.presencasSemRegistroNaSessao)}. A Câmara registra presença no dia, mas ausência na ata da
            sessão; a ata prevalece e esses dias não contam como presença.
          </p>
        )}
        <Explicacao resumo="Como esta conta é feita">
          <p>
            Dias com sessão deliberativa no Plenário da Câmara, só os dias em que o deputado estava em exercício. Ausência justificada (licença,
            missão autorizada) conta como ausência na porcentagem e aparece separada. Sessões conjuntas do Congresso não entram, por isso o total
            pode ser um pouco menor que o do site da Câmara. <Link href="/metodo#met-01">Método completo</Link>.
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
  const maxEscala = Math.max(1.25, Math.ceil(Math.max(...c.valoresReferenciaUf, c.percentual ?? 0) * 4) / 4);
  const totalCategorias = c.categorias.reduce((t, x) => t + x.centavos, 0);
  return (
    <Card aria-labelledby="t-cota">
      <Cabecalho id="t-cota" icone={<Carteira />} titulo={titulo} periodo={periodo} />
      <CardContent>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
          <div>
            <Numero valor={reais(c.gastoCentavos)} complemento={`em ${plural(c.mesesEmExercicio, 'mês', 'meses')} em exercício`} />
            <p className="text-sm">
              Equivale a <strong>{percentual(c.percentual)}</strong> do valor-base da cota {doEstado(uf)} no período ({reais(c.valorBaseCentavos)}).
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <Indicador rotulo="Fornecedores diferentes" valor={inteiro(c.totalFornecedores)} />
              <Indicador rotulo="Nos 3 maiores fornecedores" valor={percentual(c.concentracaoTop3)} />
            </dl>
            {!c.entraNaReferencia && (
              <Aviso>
                Período curto: {plural(c.mesesEmExercicio, 'mês', 'meses')} em exercício, menos que os {c.minMesesReferencia} usados na comparação com
                o estado.
              </Aviso>
            )}
          </div>
          {c.referenciaUf && (
            <div id="posicao-cota" className="scroll-mt-28 p-1">
              <Subtitulo>
                Onde está entre os {inteiro(c.referenciaUf.n)} deputados {doEstado(uf)}?
              </Subtitulo>
              <p className="mb-1 text-base">
                {c.posicaoUf && c.entraNaReferencia ? (
                  <>
                    <strong className="font-semibold">
                      {frasePosicao(c.posicaoUf, {
                        maiorQue: 'Usou uma parte maior do valor-base que a de',
                        nenhumAcima: `Nenhum deputado ${doEstado(uf)} usou uma parte maior`,
                        valor: percentual(c.percentual),
                      })}
                    </strong>{' '}
                  </>
                ) : null}
                <span className="text-muted-foreground">
                  A média do estado é {percentual(c.referenciaUf.media)} e a mediana, {percentual(c.referenciaUf.mediana)}. O valor da cota muda de um
                  estado para outro, por isso a comparação é dentro do estado.
                </span>
              </p>
              <Posicao
                titulo={`Uso do valor-base da cota por este deputado entre os ${inteiro(c.referenciaUf.n)} deputados ${doEstado(uf)}, ${periodo}`}
                valores={c.valoresReferenciaUf}
                valor={c.percentual}
                mediana={c.referenciaUf.mediana}
                p25={c.referenciaUf.p25}
                p75={c.referenciaUf.p75}
                maximo={maxEscala}
                formato="percentual"
                nomeGrupo={`deputados ${doEstado(uf)}`}
                nomeMetrica="do valor-base"
                grupo={{ metrica: 'cota', uf }}
                ancora="posicao-cota"
                largura={680}
                altura={180}
              />
            </div>
          )}
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div>
            <Subtitulo>Quanto gastou por mês?</Subtitulo>
            <SerieMensal
              titulo={`Gasto da cota por mês, ${periodo}`}
              series={[{ chave: 'gasto', nome: 'Gasto no mês', cor: CORES.deputado }]}
              pontos={cotaPorMes(c)}
              nomeLinha="Valor-base do mês"
              formatoEixo="reaisMil"
              instrucao="Passe o mouse, toque ou use as setas para ver cada mês. O saldo não usado acumula no ano, então um mês pode passar do valor-base."
            />
          </div>
          <div>
            <Subtitulo>Com o que gastou?</Subtitulo>
            <BarrasHorizontais
              titulo="Gasto da cota por categoria"
              nomeValor="Gasto no período"
              formato="centavos"
              itens={c.categorias.slice(0, 6).map((x) => ({
                rotulo: x.categoria.replace(/\.$/, '').toLowerCase(),
                valor: x.centavos,
                dica: [reais(x.centavos), `${percentual(totalCategorias ? x.centavos / totalCategorias : null)} do gasto do período`],
              }))}
            />
          </div>
        </div>
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

function SecaoProjetos({ j, linkDados, idDeputado }: { j: ProjetosPublicados | null; linkDados: string; idDeputado: number }) {
  const titulo = 'Projetos de lei apresentados como autor principal';
  if (!j) return <SemDado titulo={titulo} id="t-projetos" icone={<Documento />} />;
  const periodo = `Desde ${mesAno(j.proveniencia.periodo.inicio)}`;
  return (
    <Card aria-labelledby="t-projetos">
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
          <div>
            <Subtitulo>Até onde os projetos chegaram?</Subtitulo>
            <BarrasHorizontais
              titulo="Projetos por estágio alcançado: deputado e mediana da Câmara"
              nomeValor="Projetos do deputado"
              nomeReferencia="Mediana da Câmara"
              formato="decimal"
              itens={(['apresentada', 'comissao', 'alem_comissao', 'aprovada_camara', 'lei'] as EstagioFunil[]).map((e) => ({
                rotulo: NOMES_ESTAGIO[e],
                valor: j.porEstagio[e],
                referencia: j.referencia.porEstagio[e]?.mediana ?? null,
                dica: [
                  `Deputado: ${plural(j.porEstagio[e], 'projeto')}`,
                  `Mediana da Câmara: ${(j.referencia.porEstagio[e]?.mediana ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}`,
                  'Cada estágio inclui os projetos que foram além dele',
                ],
              }))}
            />
          </div>
        </div>
        {j.temas.length > 0 && (
          <div className="mt-10">
            <Subtitulo>Sobre quais temas apresenta projetos?</Subtitulo>
            <p className="mb-2 text-sm text-muted-foreground">
              Parte dos projetos dele em cada tema (classificação oficial da Câmara; um projeto pode ter mais de um tema). O traço cinza é a
              parte daquele tema em todos os projetos da Câmara.
            </p>
            <BarrasHorizontais
              titulo="Temas dos projetos do deputado, comparados com a Câmara"
              nomeValor="Projetos do deputado"
              nomeReferencia="Todos os projetos da Câmara"
              formato="percentual"
              itens={j.temas.slice(0, 8).map((t) => ({
                rotulo: t.tema,
                valor: t.fatia,
                referencia: t.fatiaCamara,
                dica: [
                  `${plural(t.projetos, 'projeto')} dele (${percentual(t.fatia)} do total dele)`,
                  `Na Câmara: ${percentual(t.fatiaCamara)} dos projetos`,
                ],
              }))}
            />
          </div>
        )}
        <div className="mt-10">
          <Subtitulo>Quais são os projetos?</Subtitulo>
          <p className="mb-3 text-sm text-muted-foreground">
            A área vem dos temas oficiais da Câmara. Clique num projeto para ver o que ele propõe, em que pé está e a ementa oficial.
          </p>
          <ListaProjetos
            idDeputado={idDeputado}
            total={j.lista.length}
            iniciais={j.lista.slice(0, 20)}
            temas={j.temas.map(({ tema, projetos }) => ({ tema, projetos }))}
          />
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
