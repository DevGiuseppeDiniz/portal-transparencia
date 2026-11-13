// Versão do código que coletou (raw.coleta.versao_coletor, DEC-10).
// VERSAO_COLETOR (definida no deploy) tem prioridade; localmente usa o commit do git,
// com o sufixo "-modificado" se houver alteração não commitada.

import { execFileSync } from 'node:child_process';

export function versaoColetor(): string {
  const doAmbiente = process.env['VERSAO_COLETOR'];
  if (doAmbiente) return doAmbiente;
  try {
    const git = (args: string[]) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const commit = git(['rev-parse', '--short=12', 'HEAD']);
    return git(['status', '--porcelain']) ? `${commit}-modificado` : commit;
  } catch {
    return 'desconhecida';
  }
}
