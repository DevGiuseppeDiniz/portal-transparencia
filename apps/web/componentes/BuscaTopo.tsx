'use client';

// Busca do topo (todas as páginas): estado ou nome do deputado, com sugestões.
// Padrão "combobox" do WAI-ARIA APG: setas navegam, Enter abre, Esc fecha; o resultado é
// anunciado ao leitor de tela. A lista de nomes só é baixada quando o campo recebe foco.
// Sem ranking: sugestões em ordem alfabética, estados primeiro.

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { UFS } from '../lib/ufs';

interface Deputado {
  readonly id: number;
  readonly nome: string;
  readonly uf: string;
  readonly partido: string | null;
}

type Sugestao = { tipo: 'uf'; sigla: string; nome: string; href: string } | { tipo: 'deputado'; d: Deputado; href: string };

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const LIMITE = 8;

export function BuscaTopo() {
  const router = useRouter();
  const id = useId();
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [deputados, setDeputados] = useState<readonly Deputado[] | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  const carregar = () => {
    if (deputados) return;
    fetch('/dados/busca.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((lista: Deputado[]) => setDeputados(lista))
      .catch(() => setDeputados([]));
  };

  const sugestoes = useMemo<Sugestao[]>(() => {
    const t = normalizar(termo);
    if (!t) return [];
    const ufs: Sugestao[] = UFS.filter((u) => normalizar(u.sigla) === t || normalizar(u.nome).includes(t)).map((u) => ({
      tipo: 'uf', sigla: u.sigla, nome: u.nome, href: `/uf/${u.sigla.toLowerCase()}`,
    }));
    const deps: Sugestao[] =
      t.length < 2 || !deputados ? [] : deputados.filter((d) => normalizar(d.nome).includes(t)).map((d) => ({ tipo: 'deputado', d, href: `/deputado/${d.id}` }));
    return [...ufs, ...deps].slice(0, LIMITE);
  }, [termo, deputados]);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  const ir = (s: Sugestao | undefined) => {
    if (!s) return;
    setAberto(false);
    setTermo('');
    router.push(s.href);
  };

  const listaId = `${id}-lista`;
  const mostrar = aberto && termo.trim().length > 0;

  return (
    <div className="busca-topo" ref={caixa} role="search">
      <label htmlFor={`${id}-campo`} className="so-leitor">
        Buscar estado ou deputado
      </label>
      <input
        id={`${id}-campo`}
        type="search"
        placeholder="Buscar estado ou deputado"
        autoComplete="off"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={ativo >= 0 ? `${id}-op-${ativo}` : undefined}
        value={termo}
        onFocus={() => {
          carregar();
          setAberto(true);
        }}
        onChange={(e) => {
          setTermo(e.target.value);
          setAberto(true);
          setAtivo(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAberto(true);
            setAtivo((a) => Math.min(a + 1, sugestoes.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setAtivo((a) => Math.max(a - 1, -1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            ir(sugestoes[ativo >= 0 ? ativo : 0]);
          } else if (e.key === 'Escape') {
            setAberto(false);
            setAtivo(-1);
          }
        }}
      />
      <ul id={listaId} role="listbox" className="busca-sugestoes" hidden={!mostrar}>
        {sugestoes.map((s, i) => (
          <li
            key={s.href}
            id={`${id}-op-${i}`}
            role="option"
            aria-selected={i === ativo}
            className={i === ativo ? 'ativo' : undefined}
            onMouseDown={(e) => {
              e.preventDefault();
              ir(s);
            }}
            onMouseEnter={() => setAtivo(i)}
          >
            {s.tipo === 'uf' ? (
              <>
                <span className="etiqueta">Estado</span> {s.nome}
              </>
            ) : (
              <>
                <span className="etiqueta">Deputado</span> {s.d.nome} <span className="suave">· {s.d.partido ?? 'sem partido'} · {s.d.uf}</span>
              </>
            )}
          </li>
        ))}
        {mostrar && sugestoes.length === 0 && (
          <li role="option" aria-disabled="true" aria-selected={false} className="vazio">
            {deputados === null ? 'Carregando nomes…' : `Nada encontrado para “${termo.trim()}”.`}
          </li>
        )}
      </ul>
      <p className="so-leitor" role="status" aria-live="polite">
        {mostrar ? `${sugestoes.length} sugestão(ões)` : ''}
      </p>
    </div>
  );
}
