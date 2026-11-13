import { BuscaDeputado } from '../componentes/BuscaDeputado';
import { SeletorEstado } from '../componentes/SeletorEstado';
import { UFS, lerIndice, listarDeputados } from '../lib/dados';
import { dataDeIso } from '../lib/formato';

// Home: 1º busca pelo nome (o que a maioria procura, REF-08/REF-33), 2º escolha do estado
// (busca de estado acima do mapa, com a lista ao lado). Visão geral → detalhe (DSG-01).
export default function Inicio() {
  const deputados = listarDeputados();
  const indice = lerIndice();
  const porUf = new Map<string, number>();
  for (const d of deputados) porUf.set(d.uf, (porUf.get(d.uf) ?? 0) + 1);
  const estados = UFS.map((u) => ({ ...u, deputados: porUf.get(u.sigla) ?? 0 }));

  return (
    <>
      <section className="heroi" aria-labelledby="titulo-inicio">
        <div className="contido">
          <span className="sobretitulo">Câmara dos Deputados · dados públicos</span>
          <h1 id="titulo-inicio">Encontre seu deputado federal</h1>
          <p className="lead">
            Presença nas sessões, uso da cota para despesas do mandato e projetos de lei de cada deputado em exercício, com a fonte oficial de
            cada número. Sem nota e sem ranking.
          </p>
          {deputados.length > 0 && (
            <div className="busca-principal" id="nome">
              <BuscaDeputado deputados={deputados.map(({ id, nome, partido, uf, urlFoto }) => ({ id, nome, partido, uf, urlFoto }))} />
            </div>
          )}
          <ul className="pilulas" aria-label="Sobre os dados">
            <li className="pilula">{deputados.length} deputados em exercício</li>
            <li className="pilula">27 estados</li>
            {indice && <li className="pilula">Atualizado em {dataDeIso(indice.geradoEm)}</li>}
          </ul>
        </div>
      </section>

      <main id="conteudo">
        {deputados.length === 0 ? (
          <p className="aviso">Ainda não há dados publicados.</p>
        ) : (
          <section className="secao" id="estados" aria-labelledby="titulo-estados">
            <div className="secao-cabecalho">
              <h2 id="titulo-estados">Ou escolha pelo estado</h2>
              <p>Cada estado elege uma bancada de deputados federais; veja quem representa o seu.</p>
            </div>
            <div className="cartao">
              <SeletorEstado estados={estados} />
            </div>
          </section>
        )}
      </main>
    </>
  );
}
