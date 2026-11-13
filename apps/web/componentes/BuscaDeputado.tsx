'use client';

// Busca pelo nome (DEC-02), principal ação da home. Filtra no navegador a lista publicada,
// sem acento e sem diferenciar maiúsculas. Resultado em ordem alfabética (DEC-01: sem ranking).

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Lupa } from './Icones';
import { CampoComIcone, classeInput } from './ui';

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
  if (urlFoto) return <img className="size-11 shrink-0 rounded-full bg-muted object-cover object-[center_20%]" src={urlFoto} alt="" width={44} height={44} loading="lazy" />;
  const iniciais = nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground" aria-hidden="true">
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
      <label htmlFor={`${id}-nome`} className="mb-2 block text-sm font-medium">
        Nome do deputado ou da deputada
      </label>
      <CampoComIcone icone={<Lupa tamanho={20} />}>
        <input
          id={`${id}-nome`}
          type="text"
          placeholder="Digite o nome ou parte dele"
          autoComplete="off"
          spellCheck={false}
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          aria-describedby={`${id}-status`}
          className={`${classeInput} h-14 rounded-xl pl-11 text-lg shadow-sm md:text-lg`}
        />
      </CampoComIcone>
      <p id={`${id}-status`} role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-muted-foreground">
        {t.length === 0
          ? ''
          : t.length < 2
            ? 'Digite pelo menos 2 letras.'
            : achados.length === 0
              ? `Nenhum deputado em exercício com “${termo.trim()}” no nome. Confira a grafia ou escolha pelo estado.`
              : `${achados.length} encontrado(s)${achados.length > LIMITE ? `; mostrando os ${LIMITE} primeiros` : ''}.`}
      </p>
      {achados.length > 0 && <ListaDeputados deputados={achados.slice(0, LIMITE)} />}
    </div>
  );
}

/** Lista de deputados como cartões clicáveis (ordem recebida: alfabética, DEC-01). */
export function ListaDeputados({ deputados, mostrarUf = true }: { deputados: readonly Item[]; mostrarUf?: boolean }) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {deputados.map((d) => (
        <li key={d.id}>
          <Link
            href={`/deputado/${d.id}`}
            className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-3 text-card-foreground shadow-xs transition-colors hover:border-primary/50 hover:bg-accent/40 hover:no-underline"
          >
            <Avatar nome={d.nome} urlFoto={d.urlFoto} />
            <span className="min-w-0">
              <span className="block truncate font-medium">{d.nome}</span>
              <span className="block text-sm text-muted-foreground">
                {d.partido ?? 'sem partido'}
                {mostrarUf && ` · ${d.uf}`}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
