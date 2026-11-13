// Régua das 5 etapas do funil (MET-03), com a etapa alcançada destacada.

import type { EstagioFunil } from '@portal/metrics';

const ETAPAS: ReadonlyArray<{ chave: EstagioFunil; nome: string }> = [
  { chave: 'apresentada', nome: 'Apresentado' },
  { chave: 'comissao', nome: 'Parecer em comissão' },
  { chave: 'alem_comissao', nome: 'Passou das comissões' },
  { chave: 'aprovada_camara', nome: 'Aprovado na Câmara' },
  { chave: 'lei', nome: 'Virou lei' },
];

export function EtapasProjeto({ estagio }: { estagio: EstagioFunil }) {
  const ate = ETAPAS.findIndex((e) => e.chave === estagio);
  return (
    <ol className="flex items-center gap-1" aria-label={`Chegou até: ${ETAPAS[ate]?.nome}`}>
      {ETAPAS.map((e, i) => (
        <li key={e.chave} className="flex flex-1 flex-col gap-1" aria-current={i === ate ? 'step' : undefined}>
          <span className={`h-1.5 rounded-full ${i <= ate ? 'bg-deputado' : 'bg-muted'}`} />
          <span className={`hidden text-[11px] leading-tight sm:block ${i === ate ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{e.nome}</span>
        </li>
      ))}
    </ol>
  );
}
