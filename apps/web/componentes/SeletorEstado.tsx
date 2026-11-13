'use client';

// Escolha do estado: campo de busca logo acima do mapa, mapa e lista sincronizados.
// Digitar realça o estado no mapa e na lista; Enter abre a página do estado. O mapa é só um
// atalho: a lista é a via acessível e a melhor para estados pequenos no toque (REF-31).

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState } from 'react';
import { Lupa } from './Icones';
import { CampoComIcone, classeInput, cn } from './ui';
import { MapaBrasil } from './MapaBrasil';

interface Estado {
  readonly sigla: string;
  readonly nome: string;
  readonly deputados: number;
}

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function SeletorEstado({ estados }: { estados: readonly Estado[] }) {
  const router = useRouter();
  const id = useId();
  const [termo, setTermo] = useState('');
  const [hover, setHover] = useState<string | null>(null);

  const t = normalizar(termo);
  const filtrados = useMemo(
    () => (t ? estados.filter((e) => normalizar(e.sigla) === t || normalizar(e.nome).includes(t)) : estados),
    [estados, t],
  );
  // Sigla digitada exata ganha; senão, o primeiro que casa.
  const daBusca = t ? (estados.find((e) => normalizar(e.sigla) === t) ?? filtrados[0])?.sigla ?? null : null;
  const ativo = hover ?? daBusca;
  const atual = estados.find((e) => e.sigla === ativo);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
      <div>
        <label htmlFor={`${id}-uf`} className="sr-only">
          Buscar estado
        </label>
        <CampoComIcone icone={<Lupa tamanho={18} />}>
          <input
            id={`${id}-uf`}
            type="text"
            placeholder="Digite o estado ou a sigla (ex.: Bahia, SP)"
            autoComplete="off"
            spellCheck={false}
            value={termo}
            aria-describedby={`${id}-status`}
            className={classeInput}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && daBusca) {
                e.preventDefault();
                router.push(`/uf/${daBusca.toLowerCase()}`);
              }
            }}
          />
        </CampoComIcone>
        <p id={`${id}-status`} role="status" aria-live="polite" className="mt-3 mb-1 min-h-6 text-sm font-medium">
          {atual ? (
            <>
              {atual.nome} · {atual.deputados} deputado{atual.deputados === 1 ? '' : 's'}
              {daBusca && !hover && <span className="font-normal text-muted-foreground"> — Enter para abrir</span>}
            </>
          ) : t ? (
            <span className="font-normal text-muted-foreground">Nenhum estado com “{termo.trim()}”.</span>
          ) : (
            <span className="font-normal text-muted-foreground">Passe o cursor, toque ou digite um estado</span>
          )}
        </p>
        <MapaBrasil estados={estados} ativo={ativo} aoAtivar={setHover} />
        <p className="mt-2 text-xs text-muted-foreground">
          Malha estadual: IBGE. O mapa só serve para escolher o estado; as cores não representam nenhum dado.
        </p>
      </div>
      <nav aria-label="Lista de estados">
        <ul className="grid grid-cols-2 gap-1">
          {filtrados.map((e) => (
            <li key={e.sigla}>
              <Link
                href={`/uf/${e.sigla.toLowerCase()}`}
                className={cn(
                  'flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground hover:no-underline',
                  ativo === e.sigla && 'bg-accent text-accent-foreground',
                )}
                onMouseEnter={() => setHover(e.sigla)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(e.sigla)}
                onBlur={() => setHover(null)}
              >
                <span>{e.nome}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{e.deputados}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
