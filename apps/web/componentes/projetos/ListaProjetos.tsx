'use client';

// Todos os projetos do deputado, com filtro por tema, por etapa e por texto. A página traz os
// mais recentes; a lista completa vem do JSON publicado do deputado, só quando pedida (quem
// tem mais de mil projetos não pesa a página). Ordem: do mais recente ao mais antigo.

import { useId, useMemo, useState } from 'react';
import type { EstagioFunil } from '@portal/metrics';
import type { DeputadoPublicado, ProjetoPublicado } from '@portal/metrics/publicacao';
import { inteiro } from '../../lib/formato';
import { doQueTrata } from '../../lib/projetos';
import { Lupa } from '../Icones';
import { CampoComIcone, botao, classeInput, classeSelect } from '../ui';
import { CartaoProjeto } from './CartaoProjeto';

const ETAPAS: ReadonlyArray<[EstagioFunil | '', string]> = [
  ['', 'Todas as etapas'],
  ['comissao', 'Receberam parecer em comissão'],
  ['alem_comissao', 'Passaram das comissões'],
  ['aprovada_camara', 'Aprovados na Câmara'],
  ['lei', 'Viraram lei'],
];
const ORDEM: readonly EstagioFunil[] = ['apresentada', 'comissao', 'alem_comissao', 'aprovada_camara', 'lei'];
const POR_PAGINA = 15;

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

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
  const [todos, setTodos] = useState<readonly ProjetoPublicado[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const [tema, setTema] = useState('');
  const [etapa, setEtapa] = useState<EstagioFunil | ''>('');
  const [busca, setBusca] = useState('');
  const [limite, setLimite] = useState(POR_PAGINA);

  const carregar = () => {
    if (todos || carregando) return;
    setCarregando(true);
    fetch(`/dados/deputados/${idDeputado}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<DeputadoPublicado>) : Promise.reject(new Error(String(r.status)))))
      .then((d) => setTodos(d.projetos?.lista ?? []))
      .catch(() => setErro(true))
      .finally(() => setCarregando(false));
  };

  const filtrados = useMemo(() => {
    if (!todos) return null;
    const t = normalizar(busca.trim());
    const minimo = etapa ? ORDEM.indexOf(etapa) : 0;
    return todos.filter(
      (p) =>
        (!tema || p.temas.includes(tema)) &&
        ORDEM.indexOf(p.estagio) >= minimo &&
        (!t || normalizar(`${p.sigla} ${p.numero}/${p.ano} ${p.ementa} ${p.palavrasChave.join(' ')} ${doQueTrata(p).texto}`).includes(t)),
    );
  }, [todos, tema, etapa, busca]);

  const visiveis = filtrados ? filtrados.slice(0, limite) : iniciais;

  return (
    <div>
      {todos === null ? (
        <p className="mb-3 text-sm text-muted-foreground">
          Os {inteiro(iniciais.length)} mais recentes de {inteiro(total)} projetos.
        </p>
      ) : (
        <div className="mb-4 grid gap-3 rounded-xl border bg-muted/40 p-3 sm:grid-cols-3">
          <div>
            <label htmlFor={`${id}-busca`} className="mb-1 block text-xs font-medium">
              Buscar nos projetos
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
                  setLimite(POR_PAGINA);
                }}
              />
            </CampoComIcone>
          </div>
          <div>
            <label htmlFor={`${id}-tema`} className="mb-1 block text-xs font-medium">
              Tema
            </label>
            <select
              id={`${id}-tema`}
              className={classeSelect}
              value={tema}
              onChange={(e) => {
                setTema(e.target.value);
                setLimite(POR_PAGINA);
              }}
            >
              <option value="">Todos os temas</option>
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
            <select
              id={`${id}-etapa`}
              className={classeSelect}
              value={etapa}
              onChange={(e) => {
                setEtapa(e.target.value as EstagioFunil | '');
                setLimite(POR_PAGINA);
              }}
            >
              {ETAPAS.map(([v, rotulo]) => (
                <option key={v} value={v}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {filtrados && (
        <p role="status" aria-live="polite" className="mb-3 text-sm font-medium">
          {filtrados.length === 0 ? 'Nenhum projeto com esses filtros.' : `${inteiro(filtrados.length)} projeto(s) encontrado(s).`}
        </p>
      )}

      <ul className="grid gap-3 lg:grid-cols-2">
        {visiveis.map((p) => (
          <li key={p.id}>
            <CartaoProjeto p={p} />
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-3">
        {todos === null && total > iniciais.length && (
          <button type="button" className={botao('default')} onClick={carregar} disabled={carregando}>
            {carregando ? 'Carregando…' : `Ver todos os ${inteiro(total)} projetos e filtrar`}
          </button>
        )}
        {filtrados && filtrados.length > limite && (
          <button type="button" className={botao('outline')} onClick={() => setLimite((l) => l + POR_PAGINA)}>
            Mostrar mais {inteiro(Math.min(POR_PAGINA, filtrados.length - limite))}
          </button>
        )}
      </div>
      {erro && <p className="mt-2 text-sm text-muted-foreground">Não foi possível carregar a lista completa. Tente de novo.</p>}
    </div>
  );
}
