import Link from 'next/link';
import { BuscaDeputado } from '../componentes/BuscaDeputado';
import { MapaBrasil } from '../componentes/MapaBrasil';
import { UFS, listarDeputados } from '../lib/dados';

// Entrada pelo nome ou pelo estado (DEC-02, REF-08, REF-12): visão geral → detalhe (DSG-01).
// O mapa é só um seletor de estado; a lista ao lado é a alternativa acessível e a mais fácil
// para estados pequenos no toque (WCAG 2.5.8).
export default function Inicio() {
  const deputados = listarDeputados();
  const porUf = new Map<string, number>();
  for (const d of deputados) porUf.set(d.uf, (porUf.get(d.uf) ?? 0) + 1);
  const estados = UFS.map((u) => ({ ...u, deputados: porUf.get(u.sigla) ?? 0 }));

  return (
    <>
      <h1>Encontre seu deputado federal</h1>
      <p>
        Presença nas sessões, uso da cota para despesas do mandato e projetos de lei de cada um dos 513 deputados em
        exercício, com a fonte oficial de cada número. Sem nota e sem ranking: cada número aparece com a comparação com
        os demais deputados e com o link para conferir.
      </p>

      {deputados.length === 0 ? (
        <p className="aviso">Ainda não há dados publicados.</p>
      ) : (
        <>
          <h2>Pelo estado</h2>
          <div className="home-estados">
            <MapaBrasil estados={estados} />
            <nav aria-label="Estados">
              <ul className="ufs">
                {estados.map((u) => (
                  <li key={u.sigla}>
                    <Link href={`/uf/${u.sigla.toLowerCase()}`}>
                      {u.nome} <span className="suave pequeno">({u.deputados})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <h2>Pelo nome</h2>
          <div className="prosa">
            <BuscaDeputado deputados={deputados.map(({ id, nome, partido, uf }) => ({ id, nome, partido, uf }))} ufs={UFS} />
          </div>
        </>
      )}
    </>
  );
}
