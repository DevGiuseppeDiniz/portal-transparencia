// Página do deputado: as 3 métricas do MVP (DEC-11), cada uma com
//   título = métrica + recorte + período, sem verbo nem adjetivo (DSG-05, REF-14);
//   valor absoluto primeiro, comparação logo depois, com a base nomeada (PRI-02, parecer REF-09/10);
//   posição como contagem real, nunca "acima/abaixo da média" em destaque;
//   distribuição inteira no gráfico; método e dado bruto a 1 clique (PRI-07, DEC-07).
// Sem "você", sem negrito em valor de comparação, sem cor de bom/ruim (DSG-04, parecer REF-13).

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CotaPublicada, PresencaPublicada, ProjetosPublicados } from '@portal/metrics/publicacao';
import { Comparacao } from '../../../componentes/Comparacao';
import { Funil } from '../../../componentes/Funil';
import { Proveniencia } from '../../../componentes/Proveniencia';
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
    <>
      <p className="pequeno">
        <Link href="/">Início</Link> › <Link href={`/uf/${deputado.uf.toLowerCase()}`}>{nomeUf(deputado.uf)}</Link>
      </p>
      <div className="cabecalho-deputado">
        {deputado.urlFoto && <img src={deputado.urlFoto} alt={`Foto oficial de ${deputado.nome}`} width={88} height={116} />}
        <div>
          <h1>{deputado.nome}</h1>
          <p>
            Deputado(a) federal por {nomeUf(deputado.uf)} · {deputado.partido ?? 'sem partido'}
          </p>
          <p className="pequeno">
            <a href={deputado.urlCamara} rel="noopener noreferrer">
              Página oficial na Câmara
            </a>
          </p>
        </div>
      </div>

      <div className="grade-metricas">
        <SecaoPresenca p={presenca} linkDados={`${linkDados}#presenca`} />
        <SecaoCota c={cota} uf={deputado.uf} linkDados={`${linkDados}#cota`} />
        <SecaoProjetos j={projetos} linkDados={`${linkDados}#projetos`} />
      </div>
    </>
  );
}

function SemDado({ titulo, id }: { titulo: string; id: string }) {
  return (
    <section className="cartao" aria-labelledby={id}>
      <h2 id={id}>{titulo}</h2>
      <p>Sem dado publicado para esta métrica.</p>
    </section>
  );
}

function SecaoPresenca({ p, linkDados }: { p: PresencaPublicada | null; linkDados: string }) {
  const titulo = 'Presença em sessões deliberativas do Plenário';
  if (!p) return <SemDado titulo={titulo} id="t-presenca" />;
  const periodo = `${mesAno(p.proveniencia.periodo.inicio)} a ${mesAno(p.proveniencia.periodo.fim)}`;
  const tituloCompleto = `${titulo}, ${periodo}`;
  return (
    <section className="cartao" aria-labelledby="t-presenca">
      <h2 id="t-presenca">{tituloCompleto}</h2>
      <p className="numero">
        {percentual(p.taxa)} <small>dos dias de sessão ({inteiro(p.presencas)} de {inteiro(p.dias)})</small>
      </p>
      {p.referencia && (
        <p>
          Na Câmara, a mediana foi {percentual(p.referencia.mediana)}. Metade dos deputados ficou entre {percentual(p.referencia.p25)} e{' '}
          {percentual(p.referencia.p75)}.
          {p.posicao && p.entraNaReferencia && <> Presença maior que a de {inteiro(p.posicao.menores)} dos {inteiro(p.posicao.total)} deputados.</>}
        </p>
      )}
      {!p.entraNaReferencia && (
        <p className="aviso">
          Período curto: {plural(p.dias, 'dia')} de sessão em exercício, menos que os {p.minDiasReferencia} usados na comparação com a Câmara.
        </p>
      )}
      <Comparacao
        titulo={tituloCompleto}
        valor={p.taxa}
        referencia={p.referencia}
        valores={p.valoresReferencia}
        maximo={1}
        formatar={(v) => percentual(v)}
        rotuloDeputado="Deputado"
        rotuloReferencia="Câmara"
      />
      <ul>
        <li>
          Ausências com justificativa: {plural(p.ausenciasJustificadas, 'dia')}
          {p.justificativas.length > 0 && <> ({p.justificativas.map((j) => `${j.motivo.toLowerCase()}: ${j.dias}`).join('; ')})</>}.
        </li>
        <li>Ausências sem justificativa: {plural(p.ausenciasNaoJustificadas, 'dia')}.</li>
        {p.presencasSemRegistroNaSessao > 0 && (
          <li>
            Dias marcados “Presença (~)”: {inteiro(p.presencasSemRegistroNaSessao)}. A Câmara registra presença no dia, mas ausência na ata da
            sessão; a ata prevalece e esses dias não contam como presença.
          </li>
        )}
      </ul>
      <details>
        <summary>Como esta conta é feita</summary>
        <p>
          Dias com sessão deliberativa no Plenário da Câmara, só os dias em que o deputado estava em exercício. Ausência justificada (licença,
          missão autorizada) conta como ausência na porcentagem e aparece separada acima. Sessões conjuntas do Congresso não entram, por isso o
          total pode ser um pouco menor que o do site da Câmara. <Link href="/metodo#met-01">Método completo</Link>.
        </p>
      </details>
      <Proveniencia p={p.proveniencia} linkDados={linkDados} />
    </section>
  );
}

function SecaoCota({ c, uf, linkDados }: { c: CotaPublicada | null; uf: string; linkDados: string }) {
  const titulo = 'Uso da cota para despesas do mandato';
  if (!c) return <SemDado titulo={titulo} id="t-cota" />;
  const periodo = `${mesAno(c.proveniencia.periodo.inicio)} a ${mesAno(c.proveniencia.periodo.fim)}`;
  const tituloCompleto = `${titulo}, ${periodo}`;
  const escala = Math.max(1.25, ...c.valoresReferenciaUf, c.percentual ?? 0);
  return (
    <section className="cartao" aria-labelledby="t-cota">
      <h2 id="t-cota">{tituloCompleto}</h2>
      <p className="numero">
        {reais(c.gastoCentavos)} <small>em {plural(c.mesesEmExercicio, 'mês', 'meses')} em exercício</small>
      </p>
      <p>
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
        <p className="aviso">
          Período curto: {plural(c.mesesEmExercicio, 'mês', 'meses')} em exercício, menos que os {c.minMesesReferencia} usados na comparação com o
          estado.
        </p>
      )}
      <Comparacao
        titulo={`${tituloCompleto}, em relação ao valor-base`}
        valor={c.percentual}
        referencia={c.referenciaUf}
        valores={c.valoresReferenciaUf}
        maximo={escala}
        formatar={(v) => percentual(v)}
        rotuloDeputado="Deputado"
        rotuloReferencia={uf}
      />
      <h3>Maiores categorias de gasto</h3>
      <ul>
        {c.categorias.slice(0, 3).map((x) => (
          <li key={x.categoria}>
            {x.categoria.replace(/\.$/, '').toLowerCase()}: {reais(x.centavos)}
          </li>
        ))}
      </ul>
      <details>
        <summary>Por que o percentual pode passar de 100%</summary>
        <p>
          O valor-base é o valor mensal da cota para o estado (Ato da Mesa 43/2009). A regra permite acumular o saldo não usado ao longo do ano, há
          adicionais para alguns cargos, e o que passar do saldo anual é descontado do salário do deputado. Por isso passar de 100% do valor-base
          não indica, por si, irregularidade. Gastar menos também não indica, por si, um mandato melhor.{' '}
          <Link href="/metodo#met-02">Método completo</Link>.
        </p>
      </details>
      <Proveniencia p={c.proveniencia} linkDados={linkDados} />
    </section>
  );
}

function SecaoProjetos({ j, linkDados }: { j: ProjetosPublicados | null; linkDados: string }) {
  const titulo = 'Projetos de lei apresentados como autor principal';
  if (!j) return <SemDado titulo={titulo} id="t-projetos" />;
  const periodo = `desde ${mesAno(j.proveniencia.periodo.inicio)}`;
  return (
    <section className="cartao largo" aria-labelledby="t-projetos">
      <h2 id="t-projetos">
        {titulo}, {periodo}
      </h2>
      <p className="numero">
        {inteiro(j.porEstagio.apresentada)} <small>apresentados · {inteiro(j.porEstagio.lei)} viraram lei</small>
      </p>
      <p>
        Na Câmara, {inteiro(j.referencia.deputadosComLei)} dos {inteiro(j.referencia.totalDeputados)} deputados em exercício tiveram ao menos um
        projeto próprio transformado em lei nesta legislatura.
      </p>
      <Funil projetos={j} />
      <ul>
        <li>Apensados a outro projeto: {inteiro(j.apensados)}. Tramitam junto com outro projeto, e o conteúdo pode seguir no projeto principal.</li>
        <li>
          Arquivados: {inteiro(j.arquivados)} · retirados pelo autor: {inteiro(j.retirados)} · devolvidos ao autor: {inteiro(j.devolvidos)}.
        </li>
      </ul>
      <details>
        <summary>O que esta contagem não mostra</summary>
        <p>
          Conta só projetos de lei (PL, PLP e PEC) em que o deputado é o primeiro autor. Não mostra relatoria de projetos de outros deputados,
          emendas, fiscalização nem votos. Projetos recentes ainda não tiveram tempo de avançar. <Link href="/metodo#met-03">Método completo</Link>.
        </p>
      </details>
      <Proveniencia p={j.proveniencia} linkDados={linkDados} />
    </section>
  );
}
