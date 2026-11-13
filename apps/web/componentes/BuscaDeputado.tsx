'use client';

// Busca por nome (DEC-02), no próprio navegador, sobre a lista publicada: nenhum pedido ao
// servidor. Ignora acentos e maiúsculas. Resultado em ordem alfabética (DEC-01: sem ranking).

import Link from 'next/link';
import { useMemo, useState } from 'react';

interface Item {
  readonly id: number;
  readonly nome: string;
  readonly partido: string | null;
  readonly uf: string;
}

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const LIMITE = 20;

export function BuscaDeputado({ deputados, ufs }: { deputados: readonly Item[]; ufs: ReadonlyArray<{ sigla: string; nome: string }> }) {
  const [termo, setTermo] = useState('');
  const indice = useMemo(() => deputados.map((d) => ({ d, chave: normalizar(d.nome) })), [deputados]);
  const t = normalizar(termo);
  const achados = t.length < 2 ? [] : indice.filter((x) => x.chave.includes(t)).map((x) => x.d);
  // Também aceita o estado, pela sigla ou pelo nome (parecer REF-12, 2026-11-13).
  const uf = t.length < 2 ? undefined : ufs.find((u) => normalizar(u.sigla) === t || normalizar(u.nome) === t || (t.length >= 4 && normalizar(u.nome).startsWith(t)));

  return (
    <div>
      <label htmlFor="busca">Nome do deputado ou da deputada, ou o estado</label>
      <input id="busca" type="search" autoComplete="off" value={termo} onChange={(e) => setTermo(e.target.value)} aria-describedby="busca-status" />
      <p id="busca-status" className="pequeno suave" role="status" aria-live="polite">
        {t.length < 2
          ? 'Digite pelo menos 2 letras.'
          : achados.length === 0
            ? uf
              ? `Nenhum nome com “${termo.trim()}”. Veja os deputados de ${uf.nome} no link abaixo.`
              : `Nenhum deputado em exercício com “${termo.trim()}” no nome. Confira a grafia ou procure pelo estado.`
            : `${achados.length} encontrado(s)${achados.length > LIMITE ? `; mostrando os ${LIMITE} primeiros` : ''}.`}
      </p>
      {uf && (
        <p>
          <Link href={`/uf/${uf.sigla.toLowerCase()}`}>Deputados de {uf.nome}</Link>
        </p>
      )}
      {achados.length > 0 && (
        <ul className="lista-deputados">
          {achados.slice(0, LIMITE).map((d) => (
            <li key={d.id}>
              <Link href={`/deputado/${d.id}`}>
                <span>
                  <strong>{d.nome}</strong>
                  <br />
                  <span className="pequeno suave">
                    {d.partido ?? 'sem partido'} · {d.uf}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
