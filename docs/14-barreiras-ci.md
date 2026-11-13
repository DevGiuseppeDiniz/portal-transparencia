# 14 — Barreiras de CI

DEC-13. Nada vai para produção sem o job `portao-producao` verde
(`.github/workflows/ci.yml`). Scripts em `scripts/ci/`, sem dependências externas.
Testadas em 2026-11-13 contra um projeto propositalmente ruim: todas bloquearam.

## Mapa

| Ameaça | Barreira | Arquivo | Quando roda |
|---|---|---|---|
| Pacote inventado pela IA / não revisado | lista de aprovação + checagem no registro | `check-deps.mjs` | antes de qualquer install |
| Lockfile adulterado / registro trocado | registro oficial + integridade | `check-lockfile.mjs` | antes do install |
| Versão maliciosa recém-publicada | `minimumReleaseAge` 7 dias, `trustPolicy`, `blockExoticSubdeps`, `strictDepBuilds` | `pnpm-workspace.yaml` | no install |
| Vulnerabilidade conhecida em qualquer dependência | `pnpm audit --audit-level high` | `ci.yml` | após o install |
| Segredo commitado | gitleaks no histórico inteiro | `ci.yml` | todo PR |
| Segredo via `NEXT_PUBLIC_` | lista de aprovação + nome suspeito + `.env` versionado | `check-env-publicas.mjs` | todo PR |
| Segredo vazando para o bundle | build com canários + varredura do build | `gerar-canarios.mjs`, `check-bundle-segredos.mjs` | todo PR |
| CVE no Next.js/React | OSV, tolerância zero | `check-framework-vulns.mjs` | todo PR + **diário** |
| Superfície de servidor do Next | sem Server Actions, só GET, banco fora do cliente, `poweredByHeader` | `check-superficie-servidor.mjs` | todo PR |

## Barreira 1
### Pacotes inventados pela IA (slopsquatting)
- **Como funciona:** toda dependência declarada precisa estar em
  `security/dependencias-aprovadas.json` com motivo, quem aprovou e quando. O script
  também consulta o npm: o pacote precisa existir (404 = nome inventado), ter pelo menos 90
  dias, ter repositório declarado, ter pelo menos 1000 downloads/semana e não estar
  deprecated. Git, URL, `file:`, alias `npm:` e tags (`latest`) são proibidos.
- **Dependency confusion:** pacote interno (`@portal/*`) só com `workspace:*`.
- **Ordem:** o job `build` (que instala) depende do job `dependencias`. Um pacote
  inventado **nunca chega a ser baixado** no CI.
- **Localmente:** rode `pnpm barreira:deps` **antes** de `pnpm install` quando a IA
  sugerir uma dependência.
- **Adicionar uma dependência:** 1) conferir no npmjs.com que é o pacote certo (não um
  nome parecido); 2) adicionar a entrada na lista; 3) só então instalar. Exceções de
  idade/downloads/repositório exigem justificativa escrita em `excecoes`.

## Barreira 2
### Chaves vazando para o navegador
Três camadas:
1. **Código:** só as `NEXT_PUBLIC_*` de `security/env-publicas.json`. Nome com KEY,
   SECRET, TOKEN, AUTH etc. é bloqueado mesmo se estiver listado.
2. **Repositório:** gitleaks no histórico inteiro; `.env` versionado é bloqueado.
3. **Build (a mais forte):** cada segredo de `security/env-servidor.json` recebe um
   valor-canário. O app é compilado com esses valores, e o que vai para o navegador
   (`.next/static`, HTML/RSC pré-renderizados, `out/`) é varrido. Pega também o vazamento
   indireto: um segredo lido no servidor e passado como prop para um componente cliente.
- **Novo segredo:** adicionar o nome em `security/env-servidor.json`. Sem isso, a camada 3
  não o testa.

## Barreira 3
### Falhas do próprio Next.js
1. **CVE conhecida:** as versões resolvidas de `next`, `@next/*`, `react`, `react-dom` e
   `react-server-dom-*` são consultadas no OSV. Qualquer vulnerabilidade bloqueia, sem
   lista de exceções. Roda **diariamente**: uma versão segura ontem pode não estar hoje.
   No teste, `next@15.2.2` foi bloqueado com 37 advisories (inclui CVE-2025-29927).
2. **Superfície mínima (DEC-12):** proibido `"use server"`, route handlers de escrita e
   componente cliente importando o banco. Exige `poweredByHeader: false`.
3. **Atualização:** Dependabot semanal com o grupo `framework`; os PRs passam pelas
   mesmas barreiras.

## Patch urgente
Quando sai um patch de segurança do Next.js, o `minimumReleaseAge` (7 dias) bloquearia a
versão corrigida enquanto a barreira 3 bloqueia a atual. Procedimento:
1. Conferir o advisory oficial (GitHub Security Advisories do `vercel/next.js`).
2. Adicionar **só a versão exata** em `minimumReleaseAgeExclude` (ex.: `'next@16.4.7'`).
3. Registrar aqui: data, versão, advisory, quem aprovou.
4. Remover a exclusão depois de 7 dias.

| Data | Versão | Advisory | Aprovado por | Removido em |
|---|---|---|---|---|

## Configuração manual (fora do código)
- [x] Proteção da branch `main` (2026-11-13): ruleset "main protegida pelas barreiras"
      (id 27205354) com PR obrigatório, status `portao-producao` exigido (branch
      atualizada com a main), force push e exclusão bloqueados, **sem bypass** (nem o
      dono). Aprovações exigidas: 0, porque o projeto tem um mantenedor só; subir para 1
      quando entrar outra pessoa.
      Conferir: `gh api repos/{owner}/{repo}/rules/branches/main`.
- [ ] Workflow de deploy (quando existir) com `needs: portao-producao`.
- [ ] Alertas do Dependabot e secret scanning do GitHub ligados.
- [ ] Notificação quando a execução diária falhar.

## Limitações conhecidas
- Allowlist + checagem do registro não detectam um pacote **legítimo e antigo** que foi
  comprometido. Isso é coberto em parte por `minimumReleaseAge`, `trustPolicy` e
  `pnpm audit`, não 100%.
- A varredura do bundle encontra segredos conhecidos (canários) e padrões comuns, não
  qualquer dado sensível.
- A checagem de superfície é estática (regex): um padrão bem disfarçado pode passar.
  Complementar com SAST (SEG-07) e revisão humana.
- Actions fixadas por SHA: atualizar via Dependabot, nunca trocar por tag.
