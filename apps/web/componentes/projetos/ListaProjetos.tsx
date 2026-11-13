'use client';

// Lista dos projetos do deputado. Barra no padrão da tabela de dados do shadcn/ui: busca,
// filtros em botão com contagem (tema, etapa, situação), "Limpar" e ordenação à direita.
// Cada linha mostra primeiro a ÁREA (temas oficiais da Câmara), depois uma linha de texto
// cortada com reticências, e na última coluna só a etapa. O clique abre a página do projeto.
// Rolagem infinita: novos itens entram ao chegar perto do fim; se a pessoa descer rápido,
// aparece o carregador. Nenhuma ordenação por "desempenho" de deputados.

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { EstagioFunil } from '@portal/metrics';
import type { DeputadoPublicado, ProjetoPublicado } from '@portal/metrics/publicacao';
import { inteiro } from '../../lib/formato';
import { doQueTrata } from '../../lib/projetos';
import { Lupa } from '../Icones';
import { CampoComIcone, botao, classeInput } from '../ui';
import { MiniEtapas, NOME_ETAPA, ORDEM_ETAPA } from './EtapasProjeto';
import { FiltroOpcoes } from './FiltroOpcoes';

type Situacao = '' | 'andamento' | 'apensado' | 'lei' | 'encerrado';
type Ordem = 'recentes' | 'antigos' | 'avancados' | 'numero';
const POR_VEZ = 20;

const SITUACOES: ReadonlyArray<{ valor: Exclude<Situacao, ''>; rotulo: string }> = [
  { valor: 'andamento', rotulo: 'Em andamento' },
  { valor: 'apensado', rotulo: 'Anexado a outro' },
  { valor: 'lei', rotulo: 'Virou lei' },
  { valor: 'encerrado', rotulo: 'Arquivado ou retirado' },
];
const ORDENS: ReadonlyArray<{ valor: Ordem; rotulo: string }> = [
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'antigos', rotulo: 'Mais antigos' },
  { valor: 'avancados', rotulo: 'Mais avançados' },
  { valor: 'numero', rotulo: 'Número' },
];

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function situacaoDe(p: ProjetoPublicado): Exclude<Situacao, ''> {
  if (p.estagio === 'lei') return 'lei';
  if (p.encerrado) return 'encerrado';
  if (p.apensado) return 'apensado';
  return 'andamento';
}

const IconeFiltro = (
  <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);
const IconeOrdem = (
  <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />
  </svg>
);

function Carregador() {
  return (
    <div role="status" className="divide-y" aria-label="Carregando mais projetos">
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid animate-pulse gap-2 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_11rem] md:items-center">
          <div className="space-y-2">
            <div className="h-5 w-40 rounded-md bg-muted" />
            <div className="h-4 w-full max-w-xl rounded bg-muted" />
          </div>
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function ListaProjetos({
  idDeputado,
  total,
  iniciais,
  temas,
}: {
  idDeputado: number;
  total: number;
  iniciais: readonly ProjetoPublicado[];
  temas: ReadonlyArray<{ tema: string; projetos: number }>;
}) {
  const id = useId();
  const caixa = useRef<HTMLDivElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const [todos, setTodos] = useState<readonly ProjetoPublicado[] | null>(total <= iniciais.length ? iniciais : null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState('');
  const [tema, setTema] = useState('');
  const [etapa, setEtapa] = useState<EstagioFunil | ''>('');
  const [situacao, setSituacao] = useState<Situacao>('');
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [limite, setLimite] = useState(POR_VEZ);

  // Carrega a lista completa quando a seção se aproxima da tela.
  useEffect(() => {
    if (todos) return;
    const el = caixa.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        fetch(`/dados/deputados/${idDeputado}.json`)
          .then((r) => (r.ok ? (r.json() as Promise<DeputadoPublicado>) : Promise.reject(new Error(String(r.status)))))
          .then((d) => setTodos(d.projetos?.lista ?? []))
          .catch(() => setErro(true));
      },
      { rootMargin: '600px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [todos, idDeputado]);

  const lista = todos ?? iniciais;

  // Cada filtro conta as opções aplicando os OUTROS filtros (contagem por faceta).
  const passa = useMemo(() => {
    const t = normalizar(busca.trim());
    const minimo = etapa ? ORDEM_ETAPA.indexOf(etapa) : 0;
    return {
      busca: (p: ProjetoPublicado) =>
        !t || normalizar(`${p.sigla} ${p.numero}/${p.ano} ${p.ementa} ${p.palavrasChave.join(' ')} ${p.temas.join(' ')}`).includes(t),
      tema: (p: ProjetoPublicado) => !tema || p.temas.includes(tema),
      etapa: (p: ProjetoPublicado) => ORDEM_ETAPA.indexOf(p.estagio) >= minimo,
      situacao: (p: ProjetoPublicado) => !situacao || situacaoDe(p) === situacao,
    };
  }, [busca, tema, etapa, situacao]);

  const contagens = useMemo(() => {
    const porTema = new Map<string, number>();
    const porEtapa = new Map<EstagioFunil, number>();
    const porSituacao = new Map<string, number>();
    for (const p of lista) {
      if (!passa.busca(p)) continue;
      if (passa.etapa(p) && passa.situacao(p)) for (const t of p.temas) porTema.set(t, (porTema.get(t) ?? 0) + 1);
      if (passa.tema(p) && passa.situacao(p)) porEtapa.set(p.estagio, (porEtapa.get(p.estagio) ?? 0) + 1);
      if (passa.tema(p) && passa.etapa(p)) porSituacao.set(situacaoDe(p), (porSituacao.get(situacaoDe(p)) ?? 0) + 1);
    }
    // "Chegou até X" conta quem chegou a X ou além.
    const ate = (e: EstagioFunil) => ORDEM_ETAPA.slice(ORDEM_ETAPA.indexOf(e)).reduce((s, x) => s + (porEtapa.get(x) ?? 0), 0);
    return { porTema, ate, porSituacao };
  }, [lista, passa]);

  const filtrados = useMemo(() => {
    const r = lista.filter((p) => passa.busca(p) && passa.tema(p) && passa.etapa(p) && passa.situacao(p));
    const porData = (a: ProjetoPublicado, b: ProjetoPublicado) => b.apresentadoEm.localeCompare(a.apresentadoEm) || b.id - a.id;
    return r.sort(
      ordem === 'recentes' ? porData
      : ordem === 'antigos' ? (a, b) => -porData(a, b)
      : ordem === 'avancados' ? (a, b) => ORDEM_ETAPA.indexOf(b.estagio) - ORDEM_ETAPA.indexOf(a.estagio) || porData(a, b)
      : (a, b) => b.ano - a.ano || a.sigla.localeCompare(b.sigla) || a.numero - b.numero,
    );
  }, [lista, passa, ordem]);

  const carregando = todos === null && !erro;
  const haMais = limite < filtrados.length || (carregando && filtrados.length >= iniciais.length);

  // Rolagem infinita: o marcador no fim da lista pede mais 20 ao se aproximar da tela. O
  // observador é refeito a cada lote; se o marcador continuar visível, pede o próximo.
  useEffect(() => {
    const el = fim.current;
    if (!el || !haMais || todos === null) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) setLimite((l) => l + POR_VEZ);
      },
      { rootMargin: '300px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [haMais, limite, todos]);

  const mudar = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setLimite(POR_VEZ);
  };
  const filtrosAtivos = Boolean(busca || tema || etapa || situacao);
  const temasOpcoes = temas
    .map((t) => ({ valor: t.tema, rotulo: t.tema, contagem: todos ? (contagens.porTema.get(t.tema) ?? 0) : t.projetos }))
    .sort((a, b) => b.contagem - a.contagem || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));

  return (
    <div ref={caixa} id="lista-projetos" className="scroll-mt-28">
      {/* Barra de ferramentas */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <CampoComIcone icone={<Lupa tamanho={16} />} className="lg:w-72">
          <label htmlFor={`${id}-busca`} className="sr-only">
            Buscar nos projetos
          </label>
          <input
            id={`${id}-busca`}
            type="search"
            placeholder="Buscar: escola, imposto, SUS…"
            className={`${classeInput} h-10`}
            value={busca}
            onChange={(e) => mudar(setBusca)(e.target.value)}
          />
        </CampoComIcone>
        <div className="rolagem-lateral -mx-4 -my-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-4 py-1 lg:mx-0 lg:overflow-visible lg:px-0">
          <FiltroOpcoes rotulo="Tema" icone={IconeFiltro} valor={tema} aoMudar={mudar(setTema)} opcoes={temasOpcoes} comBusca />
          <FiltroOpcoes
            rotulo="Chegou até"
            icone={IconeFiltro}
            semFiltro="Qualquer etapa"
            valor={etapa}
            aoMudar={(v) => mudar(setEtapa)(v as EstagioFunil | '')}
            opcoes={ORDEM_ETAPA.slice(1).map((e) => ({ valor: e, rotulo: NOME_ETAPA[e], contagem: todos ? contagens.ate(e) : undefined }))}
          />
          <FiltroOpcoes
            rotulo="Situação"
            icone={IconeFiltro}
            semFiltro="Todas"
            valor={situacao}
            aoMudar={(v) => mudar(setSituacao)(v as Situacao)}
            opcoes={SITUACOES.map((s) => ({ ...s, contagem: todos ? (contagens.porSituacao.get(s.valor) ?? 0) : undefined }))}
          />
          {filtrosAtivos && (
            <button
              type="button"
              className={`${botao('ghost', 'sm')} h-10`}
              onClick={() => {
                setBusca('');
                setTema('');
                setEtapa('');
                setSituacao('');
                setLimite(POR_VEZ);
              }}
            >
              Limpar
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
          <div className="ml-auto pl-2">
            <FiltroOpcoes rotulo="Ordenar" modo="ordem" alinhar="direita" icone={IconeOrdem} valor={ordem} aoMudar={(v) => mudar(setOrdem)(v as Ordem)} opcoes={ORDENS} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1fr)_11rem] gap-4 border-b bg-muted/50 px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid">
          <span>Área e assunto</span>
          <span>Chegou até</span>
        </div>
        <ul className="divide-y">
          {filtrados.slice(0, limite).map((p) => (
            <li key={p.id}>
              <Link
                href={`/deputado/${idDeputado}/projeto/${p.id}`}
                prefetch={false}
                className="grid gap-x-4 gap-y-2 px-4 py-3 text-foreground transition-colors hover:bg-accent/60 hover:no-underline focus-visible:bg-accent/60 md:grid-cols-[minmax(0,1fr)_11rem] md:items-center"
              >
                <span className="min-w-0">
                  {/* Área: todos os temas, rolando para o lado quando não cabem. */}
                  <span className="rolagem-lateral -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                    {p.temas.length > 0 ? (
                      p.temas.map((t) => (
                        <span key={t} className="shrink-0 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-accent-foreground">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="shrink-0 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground">Sem tema na Câmara</span>
                    )}
                  </span>
                  <span className="mt-0.5 flex min-w-0 items-baseline gap-2 text-sm">
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                      {p.sigla} {p.numero}/{p.ano}
                    </span>
                    <span className="truncate">{doQueTrata(p).texto}</span>
                  </span>
                </span>
                <MiniEtapas estagio={p.estagio} />
              </Link>
            </li>
          ))}
          {filtrados.length === 0 && !carregando && <li className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum projeto com esses filtros.</li>}
        </ul>
        <div ref={fim}>{haMais && <Carregador />}</div>
      </div>

      <p role="status" aria-live="polite" className="mt-3 text-sm text-muted-foreground">
        {carregando
          ? `Carregando os ${inteiro(total)} projetos…`
          : erro
            ? `Os ${inteiro(iniciais.length)} mais recentes (não foi possível carregar os demais).`
            : `Mostrando ${inteiro(Math.min(limite, filtrados.length))} de ${inteiro(filtrados.length)}${filtrosAtivos ? ` (de ${inteiro(total)} no total)` : ''}.`}
      </p>
    </div>
  );
}
