'use client';

// Busca do cabeçalho: navegação da aplicação ("paleta de comandos"), em todas as páginas.
// Leva a páginas e seções do portal e, como atalho, a um deputado ou estado.
// Padrão combobox do WAI-ARIA APG (REF-30): setas, Enter, Esc, aria-activedescendant, contagem
// anunciada. Visual no padrão Command do shadcn/ui (DEC-14). Atalho: "/" ou Ctrl/Cmd+K. Nomes baixados só quando o campo recebe foco.

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { UFS } from '../lib/ufs';
import { Documento, Lupa, Pagina, Pessoa, Pino } from './Icones';
import { classeInput } from './ui';

interface Deputado {
  readonly id: number;
  readonly nome: string;
  readonly uf: string;
  readonly partido: string | null;
}

interface Destino {
  readonly grupo: 'Páginas' | 'Deputados' | 'Estados';
  readonly rotulo: string;
  readonly detalhe?: string;
  readonly href: string;
  readonly icone: ReactNode;
}

/** Páginas e seções do portal, com palavras que as pessoas usam para procurá-las. */
const PAGINAS: ReadonlyArray<Destino & { chaves: string }> = [
  { grupo: 'Páginas', rotulo: 'Início', href: '/', icone: <Pagina />, chaves: 'inicio home pagina principal' },
  { grupo: 'Páginas', rotulo: 'Encontrar deputado pelo nome', href: '/#nome', icone: <Pessoa />, chaves: 'buscar procurar nome deputado deputada' },
  { grupo: 'Páginas', rotulo: 'Escolher o estado no mapa', href: '/#estados', icone: <Pino />, chaves: 'estado uf mapa regiao' },
  { grupo: 'Páginas', rotulo: 'Como calculamos', href: '/metodo', icone: <Documento />, chaves: 'metodo como calcula metodologia transparencia' },
  { grupo: 'Páginas', rotulo: 'Presença: como é calculada', href: '/metodo#met-01', icone: <Documento />, chaves: 'presenca falta ausencia sessao frequencia' },
  { grupo: 'Páginas', rotulo: 'Cota parlamentar: como é calculada', href: '/metodo#met-02', icone: <Documento />, chaves: 'cota gasto despesa ceap dinheiro verba' },
  { grupo: 'Páginas', rotulo: 'Projetos de lei: como contamos', href: '/metodo#met-03', icone: <Documento />, chaves: 'projeto lei proposicao funil aprovado' },
  { grupo: 'Páginas', rotulo: 'Fontes oficiais dos dados', href: '/metodo#fontes', icone: <Documento />, chaves: 'fonte origem dados abertos camara' },
  { grupo: 'Páginas', rotulo: 'Encontrou um erro?', href: '/metodo#erros', icone: <Documento />, chaves: 'erro corrigir contestar problema' },
];

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const LIMITE_POR_GRUPO = 5;

export function BuscaTopo() {
  const router = useRouter();
  const id = useId();
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [deputados, setDeputados] = useState<readonly Deputado[] | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  const carregar = () => {
    if (deputados) return;
    fetch('/dados/busca.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((lista: Deputado[]) => setDeputados(lista))
      .catch(() => setDeputados([]));
  };

  const destinos = useMemo<Destino[]>(() => {
    const t = normalizar(termo);
    if (!t) return PAGINAS.slice(0, 4);
    const paginas = PAGINAS.filter((p) => normalizar(`${p.rotulo} ${p.chaves}`).includes(t));
    const deps: Destino[] =
      t.length < 2 || !deputados
        ? []
        : deputados
            .filter((d) => normalizar(d.nome).includes(t))
            .slice(0, LIMITE_POR_GRUPO)
            .map((d) => ({ grupo: 'Deputados', rotulo: d.nome, detalhe: `${d.partido ?? 'sem partido'} · ${d.uf}`, href: `/deputado/${d.id}`, icone: <Pessoa /> }));
    const ufs: Destino[] = UFS.filter((u) => normalizar(u.sigla) === t || normalizar(u.nome).includes(t))
      .slice(0, LIMITE_POR_GRUPO)
      .map((u) => ({ grupo: 'Estados', rotulo: u.nome, detalhe: u.sigla, href: `/uf/${u.sigla.toLowerCase()}`, icone: <Pino /> }));
    return [...paginas.slice(0, LIMITE_POR_GRUPO), ...deps, ...ufs];
  }, [termo, deputados]);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const atalho = (e: KeyboardEvent) => {
      const digitando = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !digitando)) {
        e.preventDefault();
        campo.current?.focus();
      }
    };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', atalho);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', atalho);
    };
  }, []);

  const ir = (d: Destino | undefined) => {
    if (!d) return;
    setAberto(false);
    setTermo('');
    setAtivo(-1);
    campo.current?.blur();
    router.push(d.href);
  };

  const listaId = `${id}-lista`;
  let grupoAnterior = '';

  return (
    <div className="relative order-last w-full md:order-none md:ml-auto md:w-80" ref={caixa} role="search">
      <label htmlFor={`${id}-campo`} className="sr-only">
        Buscar no portal
      </label>
      <Lupa className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" tamanho={16} />
      <input
        ref={campo}
        id={`${id}-campo`}
        type="text"
        placeholder="Buscar no portal…"
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={ativo >= 0 ? `${id}-op-${ativo}` : undefined}
        className={`${classeInput} h-10 bg-muted/60 pr-12 focus-visible:bg-background`}
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
            setAtivo((a) => Math.min(a + 1, destinos.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setAtivo((a) => Math.max(a - 1, -1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            ir(destinos[ativo >= 0 ? ativo : 0]);
          } else if (e.key === 'Escape') {
            setAberto(false);
            setAtivo(-1);
          }
        }}
      />
      {!aberto && !termo && (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 items-center rounded border bg-background px-1.5 font-mono text-[11px] font-medium text-muted-foreground md:inline-flex"
        >
          Ctrl K
        </kbd>
      )}
      <ul
        id={listaId}
        role="listbox"
        aria-label="Destinos"
        hidden={!aberto}
        className="absolute inset-x-0 top-full z-50 mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg"
      >
        {destinos.map((d, i) => {
          const cabecalho = d.grupo !== grupoAnterior ? d.grupo : null;
          grupoAnterior = d.grupo;
          return (
            <li key={d.href} role="presentation">
              {cabecalho && (
                <div aria-hidden="true" className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                  {cabecalho}
                </div>
              )}
              <div
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={i === ativo}
                className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm ${i === ativo ? 'bg-accent text-accent-foreground' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  ir(d);
                }}
                onMouseEnter={() => setAtivo(i)}
              >
                <span className="text-muted-foreground [&>svg]:size-4">{d.icone}</span>
                <span className="truncate">{d.rotulo}</span>
                {d.detalhe && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{d.detalhe}</span>}
              </div>
            </li>
          );
        })}
        {destinos.length === 0 && (
          <li role="presentation" className="px-2 py-6 text-center text-sm text-muted-foreground">
            {deputados === null && termo.trim().length >= 2 ? 'Carregando…' : `Nada encontrado para “${termo.trim()}”.`}
          </li>
        )}
      </ul>
      <p className="sr-only" role="status" aria-live="polite">
        {aberto && termo ? `${destinos.length} resultado(s)` : ''}
      </p>
    </div>
  );
}
