'use client';

// Lista dos projetos do deputado: filtros (texto, tema, etapa, situação), ordenação e linhas
// com etiqueta de tema; o clique abre o painel lateral de detalhes (#projeto-ID na URL, para
// compartilhar). A página traz os mais recentes; a lista completa vem do JSON publicado do
// deputado quando a seção aparece na tela. Nenhuma ordenação por "desempenho" de deputados.

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { EstagioFunil } from '@portal/metrics';
import type { DeputadoPublicado, ProjetoPublicado } from '@portal/metrics/publicacao';
import { data, inteiro } from '../../lib/formato';
import { doQueTrata, situacaoSimples } from '../../lib/projetos';
import { Lupa } from '../Icones';
import { Badge, CampoComIcone, botao, classeInput, classeSelect } from '../ui';
import { PainelProjeto } from './PainelProjeto';

const ORDEM_ETAPA: readonly EstagioFunil[] = ['apresentada', 'comissao', 'alem_comissao', 'aprovada_camara', 'lei'];
const NOME_ETAPA: Record<EstagioFunil, string> = {
  apresentada: 'Apresentado',
  comissao: 'Parecer em comissão',
  alem_comissao: 'Passou das comissões',
  aprovada_camara: 'Aprovado na Câmara',
  lei: 'Virou lei',
};
type Situacao = '' | 'andamento' | 'apensado' | 'lei' | 'encerrado';
type Ordem = 'recentes' | 'antigos' | 'avancados' | 'numero';
const POR_PAGINA = 20;

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function situacaoDe(p: ProjetoPublicado): Exclude<Situacao, ''> {
  if (p.estagio === 'lei') return 'lei';
  if (p.encerrado) return 'encerrado';
  if (p.apensado) return 'apensado';
  return 'andamento';
}

function MiniEtapas({ estagio }: { estagio: EstagioFunil }) {
  const ate = ORDEM_ETAPA.indexOf(estagio);
  return (
    <span className="flex w-20 gap-0.5" aria-hidden="true">
      {ORDEM_ETAPA.map((e, i) => (
        <span key={e} className={`h-1.5 flex-1 rounded-full ${i <= ate ? 'bg-deputado' : 'bg-muted'}`} />
      ))}
    </span>
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
  const [todos, setTodos] = useState<readonly ProjetoPublicado[] | null>(total <= iniciais.length ? iniciais : null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState('');
  const [tema, setTema] = useState('');
  const [etapa, setEtapa] = useState<EstagioFunil | ''>('');
  const [situacao, setSituacao] = useState<Situacao>('');
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [limite, setLimite] = useState(POR_PAGINA);
  const [aberto, setAberto] = useState<ProjetoPublicado | null>(null);

  // Carrega a lista completa quando a seção aparece (ou já, se o link pede um projeto).
  useEffect(() => {
    if (todos) return;
    const carregar = () =>
      fetch(`/dados/deputados/${idDeputado}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<DeputadoPublicado>) : Promise.reject(new Error(String(r.status)))))
        .then((d) => setTodos(d.projetos?.lista ?? []))
        .catch(() => setErro(true));
    if (window.location.hash.startsWith('#projeto-')) {
      void carregar();
      return;
    }
    const el = caixa.current;
    if (!el) return;
    const obs = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) {
        obs.disconnect();
        void carregar();
      }
    }, { rootMargin: '400px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [todos, idDeputado]);

  // Link direto para um projeto (#projeto-123) abre o painel.
  useEffect(() => {
    const m = /^#projeto-(\d+)$/.exec(window.location.hash);
    if (!m || !todos) return;
    const alvo = todos.find((p) => p.id === Number(m[1]));
    if (alvo) setAberto(alvo);
  }, [todos]);

  const abrir = (p: ProjetoPublicado) => {
    setAberto(p);
    history.replaceState(null, '', `#projeto-${p.id}`);
  };
  const fechar = () => {
    setAberto(null);
    if (window.location.hash.startsWith('#projeto-')) history.replaceState(null, '', window.location.pathname);
  };

  const lista = todos ?? iniciais;
  const filtrados = useMemo(() => {
    const t = normalizar(busca.trim());
    const minimo = etapa ? ORDEM_ETAPA.indexOf(etapa) : 0;
    const r = lista.filter(
      (p) =>
        (!tema || p.temas.includes(tema)) &&
        ORDEM_ETAPA.indexOf(p.estagio) >= minimo &&
        (!situacao || situacaoDe(p) === situacao) &&
        (!t || normalizar(`${p.sigla} ${p.numero}/${p.ano} ${p.ementa} ${p.palavrasChave.join(' ')} ${p.temas.join(' ')}`).includes(t)),
    );
    const porData = (a: ProjetoPublicado, b: ProjetoPublicado) => b.apresentadoEm.localeCompare(a.apresentadoEm) || b.id - a.id;
    return [...r].sort(
      ordem === 'recentes' ? porData
      : ordem === 'antigos' ? (a, b) => -porData(a, b)
      : ordem === 'avancados' ? (a, b) => ORDEM_ETAPA.indexOf(b.estagio) - ORDEM_ETAPA.indexOf(a.estagio) || porData(a, b)
      : (a, b) => b.ano - a.ano || a.sigla.localeCompare(b.sigla) || a.numero - b.numero,
    );
  }, [lista, busca, tema, etapa, situacao, ordem]);

  const resetar = () => setLimite(POR_PAGINA);
  const filtrosAtivos = Boolean(busca || tema || etapa || situacao);

  return (
    <div ref={caixa}>
      <div className="mb-3 grid gap-3 rounded-xl border bg-muted/40 p-3 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <div>
          <label htmlFor={`${id}-busca`} className="mb-1 block text-xs font-medium">
            Buscar
          </label>
          <CampoComIcone icone={<Lupa tamanho={16} />}>
            <input
              id={`${id}-busca`}
              type="text"
              placeholder="Ex.: escola, imposto, SUS"
              className={classeInput}
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                resetar();
              }}
            />
          </CampoComIcone>
        </div>
        <div>
          <label htmlFor={`${id}-tema`} className="mb-1 block text-xs font-medium">
            Tema
          </label>
          <select id={`${id}-tema`} className={classeSelect} value={tema} onChange={(e) => (setTema(e.target.value), resetar())}>
            <option value="">Todos</option>
            {temas.map((t) => (
              <option key={t.tema} value={t.tema}>
                {t.tema} ({t.projetos})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-etapa`} className="mb-1 block text-xs font-medium">
            Chegou até
          </label>
          <select id={`${id}-etapa`} className={classeSelect} value={etapa} onChange={(e) => (setEtapa(e.target.value as EstagioFunil | ''), resetar())}>
            <option value="">Qualquer etapa</option>
            {ORDEM_ETAPA.slice(1).map((e) => (
              <option key={e} value={e}>
                {NOME_ETAPA[e]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-situacao`} className="mb-1 block text-xs font-medium">
            Situação
          </label>
          <select id={`${id}-situacao`} className={classeSelect} value={situacao} onChange={(e) => (setSituacao(e.target.value as Situacao), resetar())}>
            <option value="">Todas</option>
            <option value="andamento">Em andamento</option>
            <option value="apensado">Anexado a outro</option>
            <option value="lei">Virou lei</option>
            <option value="encerrado">Arquivado, retirado ou devolvido</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-ordem`} className="mb-1 block text-xs font-medium">
            Ordenar por
          </label>
          <select id={`${id}-ordem`} className={classeSelect} value={ordem} onChange={(e) => (setOrdem(e.target.value as Ordem), resetar())}>
            <option value="recentes">Mais recentes</option>
            <option value="antigos">Mais antigos</option>
            <option value="avancados">Mais avançados</option>
            <option value="numero">Número</option>
          </select>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p role="status" aria-live="polite" className="text-sm font-medium">
          {todos === null
            ? erro
              ? `Os ${inteiro(iniciais.length)} mais recentes (não foi possível carregar os demais).`
              : `Carregando os ${inteiro(total)} projetos…`
            : `${inteiro(filtrados.length)} de ${inteiro(total)} projeto(s)`}
        </p>
        {filtrosAtivos && (
          <button
            type="button"
            className={botao('ghost', 'sm')}
            onClick={() => {
              setBusca('');
              setTema('');
              setEtapa('');
              setSituacao('');
              resetar();
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {filtrados.slice(0, limite).map((p) => {
          const resumo = doQueTrata(p);
          return (
            <li key={p.id}>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => abrir(p)}
                className="grid w-full gap-x-4 gap-y-1.5 px-4 py-3 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 md:grid-cols-[minmax(0,1fr)_14rem]"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {p.sigla} {p.numero}/{p.ano}
                    </span>
                    {data(p.apresentadoEm)}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm leading-snug">{resumo.texto}</span>
                  {p.temas.length > 0 && (
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {p.temas.slice(0, 2).map((t) => (
                        <Badge key={t} className="bg-accent text-accent-foreground">
                          {t}
                        </Badge>
                      ))}
                      {p.temas.length > 2 && <Badge variante="outline">+{p.temas.length - 2}</Badge>}
                    </span>
                  )}
                </span>
                <span className="flex flex-col gap-1.5 md:items-end md:text-right">
                  <span className="text-xs leading-snug text-muted-foreground">{situacaoSimples(p.situacao)}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <MiniEtapas estagio={p.estagio} />
                    <span className="text-muted-foreground">{NOME_ETAPA[p.estagio]}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {filtrados.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum projeto com esses filtros.</li>}
      </ul>

      {filtrados.length > limite && (
        <button type="button" className={`${botao('outline')} mt-4`} onClick={() => setLimite((l) => l + POR_PAGINA)}>
          Mostrar mais {inteiro(Math.min(POR_PAGINA, filtrados.length - limite))}
        </button>
      )}

      <PainelProjeto projeto={aberto} aoFechar={fechar} />
    </div>
  );
}
