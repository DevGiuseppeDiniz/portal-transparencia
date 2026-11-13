'use client';

// Escolha do estado: campo de busca logo acima do mapa, mapa e lista sincronizados.
// Digitar realça o estado no mapa e na lista; Enter abre a página do estado. O mapa é só um
// atalho: a lista é a via acessível e a melhor para estados pequenos no toque (REF-31).

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState } from 'react';
import { Lupa } from './Icones';
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
    <div className="estados">
      <div>
        <div className="campo-busca">
          <label htmlFor={`${id}-uf`} className="so-leitor">
            Buscar estado
          </label>
          <Lupa className="lupa" tamanho={18} />
          <input
            id={`${id}-uf`}
            type="text"
            placeholder="Digite o estado ou a sigla (ex.: Bahia, SP)"
            autoComplete="off"
            spellCheck={false}
            value={termo}
            aria-describedby={`${id}-status`}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && daBusca) {
                e.preventDefault();
                router.push(`/uf/${daBusca.toLowerCase()}`);
              }
            }}
          />
        </div>
        <p id={`${id}-status`} className="mapa-rotulo" role="status" aria-live="polite">
          {atual ? (
            <>
              {atual.nome} · {atual.deputados} deputado{atual.deputados === 1 ? '' : 's'}
              {daBusca && !hover && <span className="suave pequeno"> — Enter para abrir</span>}
            </>
          ) : t ? (
            <span className="suave">Nenhum estado com “{termo.trim()}”.</span>
          ) : (
            <span className="suave">Passe o cursor, toque ou digite um estado</span>
          )}
        </p>
        <MapaBrasil estados={estados} ativo={ativo} aoAtivar={setHover} />
        <p className="legenda-mapa">Malha estadual: IBGE. O mapa só serve para escolher o estado; as cores não representam nenhum dado.</p>
      </div>
      <nav aria-label="Lista de estados">
        <ul className="ufs">
          {filtrados.map((e) => (
            <li key={e.sigla}>
              <Link
                href={`/uf/${e.sigla.toLowerCase()}`}
                className={ativo === e.sigla ? 'ativo' : undefined}
                onMouseEnter={() => setHover(e.sigla)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(e.sigla)}
                onBlur={() => setHover(null)}
              >
                <span>{e.nome}</span>
                <span className="contagem">{e.deputados}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
