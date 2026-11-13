'use client';

// Busca pelo nome (DEC-02), principal ação da home. Filtra no navegador a lista publicada,
// sem acento e sem diferenciar maiúsculas. Resultado em ordem alfabética (DEC-01: sem ranking).

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Lupa } from './Icones';

interface Item {
  readonly id: number;
  readonly nome: string;
  readonly partido: string | null;
  readonly uf: string;
  readonly urlFoto: string | null;
}

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const LIMITE = 12;

export function Avatar({ nome, urlFoto }: { nome: string; urlFoto: string | null }) {
  if (urlFoto) return <img className="avatar" src={urlFoto} alt="" width={48} height={48} loading="lazy" />;
  const iniciais = nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <span className="avatar avatar-iniciais" aria-hidden="true">
      {iniciais}
    </span>
  );
}

export function BuscaDeputado({ deputados }: { deputados: readonly Item[] }) {
  const id = useId();
  const [termo, setTermo] = useState('');
  const indice = useMemo(() => deputados.map((d) => ({ d, chave: normalizar(d.nome) })), [deputados]);
  const t = normalizar(termo);
  const achados = t.length < 2 ? [] : indice.filter((x) => x.chave.includes(t)).map((x) => x.d);

  return (
    <div>
      <label htmlFor={`${id}-nome`}>Nome do deputado ou da deputada</label>
      <div className="campo-busca grande">
        <Lupa className="lupa" tamanho={22} />
        <input
          id={`${id}-nome`}
          type="text"
          placeholder="Digite o nome ou parte dele"
          autoComplete="off"
          spellCheck={false}
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          aria-describedby={`${id}-status`}
        />
      </div>
      <p id={`${id}-status`} className="status-busca" role="status" aria-live="polite">
        {t.length === 0
          ? ''
          : t.length < 2
            ? 'Digite pelo menos 2 letras.'
            : achados.length === 0
              ? `Nenhum deputado em exercício com “${termo.trim()}” no nome. Confira a grafia ou escolha pelo estado.`
              : `${achados.length} encontrado(s)${achados.length > LIMITE ? `; mostrando os ${LIMITE} primeiros` : ''}.`}
      </p>
      {achados.length > 0 && (
        <ul className="lista-deputados">
          {achados.slice(0, LIMITE).map((d) => (
            <li key={d.id}>
              <Link href={`/deputado/${d.id}`}>
                <Avatar nome={d.nome} urlFoto={d.urlFoto} />
                <span>
                  <strong>{d.nome}</strong>
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
