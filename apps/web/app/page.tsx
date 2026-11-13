import Link from 'next/link';
import { BuscaDeputado } from '../componentes/BuscaDeputado';
import { UFS, listarDeputados } from '../lib/dados';

// Entrada pelo nome ou pelo estado (DEC-02, REF-08, REF-12): visão geral → detalhe (DSG-01).
export default function Inicio() {
  const deputados = listarDeputados();
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
          <h2>Pelo nome</h2>
          <BuscaDeputado deputados={deputados.map(({ id, nome, partido, uf }) => ({ id, nome, partido, uf }))} ufs={UFS} />

          <h2>Pelo estado</h2>
          <ul className="ufs">
            {UFS.map((u) => (
              <li key={u.sigla}>
                <Link href={`/uf/${u.sigla.toLowerCase()}`}>{u.nome}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
