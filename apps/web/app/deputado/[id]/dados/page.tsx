// Dados usados em cada conta (06-auditoria, camadas 3 e 4; DEC-07): a tabela exata, o
// cálculo que gerou o número, a fonte oficial e o arquivo publicado para baixar.

import { Voltar } from '../../../../componentes/Voltar';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ProvenienciaPublicada } from '@portal/metrics/publicacao';
import { NOMES_ESTAGIO } from '../../../../componentes/Funil';
import { lerDeputado, lerIndice, listarDeputados } from '../../../../lib/dados';
import { data, dataDeIso, inteiro, mesAno, reais } from '../../../../lib/formato';

export const dynamicParams = false;

export function generateStaticParams() {
  return listarDeputados().map((d) => ({ id: String(d.id) }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const d = lerDeputado((await params).id);
  return d ? { title: `Dados usados — ${d.deputado.nome}` } : {};
}

function Calculo({ p }: { p: ProvenienciaPublicada }) {
  return (
    <dl className="mb-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm [&_dt]:text-muted-foreground">
      <dt>Método</dt>
      <dd>
        <Link href={`/metodo#${p.metrica.toLowerCase()}`}>
          {p.metrica} ({p.versaoMetodo})
        </Link>
      </dd>
      <dt>Período</dt>
      <dd>
        {data(p.periodo.inicio)} a {data(p.periodo.fim)}
      </dd>
      <dt>Calculado em</dt>
      <dd>{dataDeIso(p.calculadoEm)}</dd>
      <dt>Coletas usadas</dt>
      <dd>
        {inteiro(p.coletas)}, a mais recente em {dataDeIso(p.ultimaColeta)}
      </dd>
      <dt>Identificador do cálculo</dt>
      <dd>
        <code>{p.calculoId}</code>
      </dd>
      <dt>Fontes oficiais</dt>
      <dd>
        {p.fontes.map((f, i) => (
          <span key={f.id}>
            {i > 0 && ' · '}
            <a href={f.url} rel="noopener noreferrer">
              {f.nome}
            </a>
          </span>
        ))}
      </dd>
    </dl>
  );
}

export default async function DadosDoDeputado({ params }: Params) {
  const { id } = await params;
  const dados = lerDeputado(id);
  if (!dados) notFound();
  const { deputado, presenca, cota, projetos } = dados;
  const hash = lerIndice()?.arquivos[`deputados/${deputado.id}.json`];

  return (
    <main id="conteudo" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold">
      <div className="mb-6 flex items-center justify-between gap-4">
      <nav aria-label="Você está em" className="min-w-0 truncate text-sm text-muted-foreground">
        <Link href="/">Início</Link> › <Link href={`/deputado/${deputado.id}`}>{deputado.nome}</Link> › Dados usados
      </nav>
        <Voltar destino={`/deputado/${deputado.id}`} />
      </div>
      <h1 className="font-bold tracking-tight">Dados usados nas contas de {deputado.nome}</h1>
      <p>
        Cada tabela abaixo é exatamente o que entrou na conta mostrada na página do deputado, com a fonte oficial para conferir. Arquivo completo:{' '}
        <a href={`/dados/deputados/${deputado.id}.json`}>{deputado.id}.json</a>
        {hash && (
          <>
            {' '}
            (SHA-256 <code className="text-xs break-all">{hash}</code>)
          </>
        )}
        .
      </p>

      <h2 id="presenca">Presença: cada dia de sessão</h2>
      {presenca ? (
        <>
          <Calculo p={presenca.proveniencia} />
          <p className="text-sm text-muted-foreground">
            Para conferir um dia na fonte oficial, abra o endereço da Câmara trocando a data:{' '}
            <code className="text-xs break-all">{presenca.urlModeloDia}</code>
          </p>
          <div className="overflow-x-auto rounded-xl border bg-card p-3 shadow-xs">
            <table className="tabela">
              <caption>{inteiro(presenca.diasDeSessao.length)} dias de sessão deliberativa em exercício</caption>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Registro da Câmara</th>
                  <th scope="col">Justificativa</th>
                </tr>
              </thead>
              <tbody>
                {presenca.diasDeSessao.map((d) => (
                  <tr key={d.data}>
                    <td>{data(d.data)}</td>
                    <td>{d.frequencia}</td>
                    <td>{d.justificativa ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>Sem dado publicado.</p>
      )}

      <h2 id="cota">Cota para despesas do mandato</h2>
      {cota ? (
        <>
          <Calculo p={cota.proveniencia} />
          <div className="overflow-x-auto rounded-xl border bg-card p-3 shadow-xs">
            <table className="tabela">
              <caption>Gasto por categoria</caption>
              <thead>
                <tr>
                  <th scope="col">Categoria</th>
                  <th scope="col" className="num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {cota.categorias.map((c) => (
                  <tr key={c.categoria}>
                    <td>{c.categoria}</td>
                    <td className="num">{reais(c.centavos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="tabela">
              <caption>
                Maiores fornecedores ({inteiro(cota.fornecedores.length)} de {inteiro(cota.totalFornecedores)}). Pessoa física aparece sem nome.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Fornecedor</th>
                  <th scope="col">CNPJ</th>
                  <th scope="col" className="num">Notas</th>
                  <th scope="col" className="num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {cota.fornecedores.map((f) => (
                  <tr key={`${f.cnpj ?? ''}${f.fornecedor}`}>
                    <td>{f.fornecedor}</td>
                    <td>{f.cnpj ?? ''}</td>
                    <td className="num">{inteiro(f.documentos)}</td>
                    <td className="num">{reais(f.centavos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="tabela">
              <caption>Valor-base mensal da cota no estado, com a norma que o fixou</caption>
              <thead>
                <tr>
                  <th scope="col">Mês</th>
                  <th scope="col" className="num">Valor-base</th>
                  <th scope="col">Norma</th>
                </tr>
              </thead>
              <tbody>
                {cota.valoresBase.map((v) => (
                  <tr key={v.mes}>
                    <td>{mesAno(v.mes)}</td>
                    <td className="num">{reais(v.centavos)}</td>
                    <td>
                      <a href={v.fonte} rel="noopener noreferrer">
                        {v.norma}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            As notas fiscais de cada despesa estão no{' '}
            <a href="https://www.camara.leg.br/transparencia/gastos-parlamentares" rel="noopener noreferrer">
              portal de gastos da Câmara
            </a>
            . Nesta versão, os meses considerados em exercício vêm do histórico do mandato na API da Câmara.
          </p>
        </>
      ) : (
        <p>Sem dado publicado.</p>
      )}

      <h2 id="projetos">Projetos de lei como autor principal</h2>
      {projetos ? (
        <>
          <Calculo p={projetos.proveniencia} />
          <div className="overflow-x-auto rounded-xl border bg-card p-3 shadow-xs">
            <table className="tabela">
              <caption>{inteiro(projetos.lista.length)} projetos, do mais recente ao mais antigo</caption>
              <thead>
                <tr>
                  <th scope="col">Projeto</th>
                  <th scope="col">Apresentado</th>
                  <th scope="col">Estágio alcançado</th>
                  <th scope="col">Situação na Câmara</th>
                  <th scope="col">Ementa</th>
                </tr>
              </thead>
              <tbody>
                {projetos.lista.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <a href={p.url} rel="noopener noreferrer">
                        {p.sigla} {p.numero}/{p.ano}
                      </a>
                    </td>
                    <td>{data(p.apresentadoEm)}</td>
                    <td>
                      {NOMES_ESTAGIO[p.estagio]}
                      {p.apensado && ' (apensado)'}
                    </td>
                    <td>{p.situacao ?? 'sem dado na fonte'}</td>
                    <td>{p.ementa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>Sem dado publicado.</p>
      )}
    </main>
  );
}
