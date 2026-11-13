# Portal Parlamentar — instruções para agentes

## Comece por aqui
- `plan.md` é o índice/dicionário do projeto. Ache a pergunta na tabela e leia **só** o
  arquivo e o header indicados. Não leia a pasta `docs/` inteira.
- IDs estáveis: `PRI` princípio, `DEC` decisão, `MET` métrica, `DSG` design, `SEG`
  segurança, `OBS` observabilidade, `REF` referência, `SRC` fonte de dados.

## Regras inegociáveis
1. **Referências:** antes de aplicar um estudo (`REF-xx`), ler na íntegra, validar e
   pesquisar replicações/críticas; atualizar o registro em `docs/08-referencias.md`. Nada
   de pesquisa antecipada (regra no `plan.md`).
2. **Dependências:** nunca rodar `pnpm add`/`install` de pacote novo antes de aprová-lo em
   `security/dependencias-aprovadas.json` e passar `pnpm barreira:deps`. A IA pode
   inventar nomes de pacote. Aprovação final é humana, no PR.
3. **Segredos:** nada de `NEXT_PUBLIC_` fora de `security/env-publicas.json`. Segredo novo
   vai para `security/env-servidor.json`.
4. **App público somente leitura (DEC-12):** sem `"use server"`, sem route handler de
   escrita, sem `@portal/db` em componente cliente.
5. **Proveniência (DEC-10):** todo dado gravado referencia a `raw.coleta` que o gerou.
6. **Sem julgamento (PRI-01):** nenhuma nota, ranking ou adjetivo avaliativo na UI.
7. A `main` é protegida: tudo entra por PR com o status `portao-producao` verde
   (`docs/14-barreiras-ci.md`).

## Comandos
- `pnpm barreiras`: barreiras locais (dependências, lockfile, NEXT_PUBLIC_, CVE do
  framework, superfície de servidor)
- `pnpm typecheck` · `pnpm --filter ./apps/web build` · `pnpm --filter @portal/ingest start`
- CI: `gh run list`, `gh run view <id> --log-failed`

## Estilo
- Responder em pt-BR, de forma direta.
- Commits: só o assunto `tipo: descrição`, sem corpo e sem trailer.
