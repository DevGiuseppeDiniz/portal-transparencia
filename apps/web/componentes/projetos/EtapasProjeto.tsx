// Régua das 5 etapas do funil (MET-03), com a etapa alcançada destacada. Módulo sem
// 'use client': serve à página do projeto (servidor) e à lista (cliente).

import type { EstagioFunil } from '@portal/metrics';

export const ORDEM_ETAPA: readonly EstagioFunil[] = ['apresentada', 'comissao', 'alem_comissao', 'aprovada_camara', 'lei'];
export const NOME_ETAPA: Readonly<Record<EstagioFunil, string>> = {
  apresentada: 'Apresentado',
  comissao: 'Parecer em comissão',
  alem_comissao: 'Passou das comissões',
  aprovada_camara: 'Aprovado na Câmara',
  lei: 'Virou lei',
};

export function EtapasProjeto({ estagio }: { estagio: EstagioFunil }) {
  const ate = ORDEM_ETAPA.indexOf(estagio);
  return (
    <ol className="flex items-start gap-1" aria-label={`Chegou até: ${NOME_ETAPA[estagio]}`}>
      {ORDEM_ETAPA.map((e, i) => (
        <li key={e} className="flex flex-1 flex-col gap-1.5" aria-current={i === ate ? 'step' : undefined}>
          <span className={`h-2 rounded-full ${i <= ate ? 'bg-deputado' : 'bg-muted'}`} />
          <span className={`text-[11px] leading-tight sm:text-xs ${i === ate ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
            {NOME_ETAPA[e]}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Versão compacta para a lista: 5 traços + o nome da etapa. */
export function MiniEtapas({ estagio }: { estagio: EstagioFunil }) {
  const ate = ORDEM_ETAPA.indexOf(estagio);
  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="flex w-16 shrink-0 gap-0.5" aria-hidden="true">
        {ORDEM_ETAPA.map((e, i) => (
          <span key={e} className={`h-1.5 flex-1 rounded-full ${i <= ate ? 'bg-deputado' : 'bg-muted'}`} />
        ))}
      </span>
      <span className="truncate text-muted-foreground">{NOME_ETAPA[estagio]}</span>
    </span>
  );
}
