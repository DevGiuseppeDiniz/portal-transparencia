# 03 — Decisões

Formato: decisão · motivo · princípio · referência · status.
Status: `aceita`, `proposta`, `revogada (substituída por DEC-xx)`.

## DEC-01 — Sem nota única nem ranking geral
- **Motivo:** a escolha e o peso dos itens embutem valor político.
- **Princípio:** PRI-01 · **Ref:** REF-06, REF-07 · **Status:** aceita

## DEC-02 — Entrada pelo CEP/UF ou pelo nome
- **Motivo:** o usuário típico quer saber do **seu** deputado, e boa parte nunca procurou.
- **Princípio:** PRI-08 · **Ref:** REF-08, REF-12 · **Status:** aceita

## DEC-03 — Comparação padrão: média da UF / da Câmara, nunca por partido
- **Motivo:** visões por partido aumentam a polarização. A visão por partido existe, mas
  é opcional e nunca a primeira tela.
- **Princípio:** PRI-06 · **Ref:** REF-15 · **Status:** aceita

## DEC-04 — Produção legislativa como funil de estágios
- **Motivo:** contar projetos apresentados premia volume, não efetividade.
- **Princípio:** PRI-04 · **Ref:** REF-05 · **Status:** aceita

## DEC-05 — Temas de votação com curadoria pública e versionada
- **Princípio:** PRI-05 · **Ref:** REF-06, REF-07 · **Status:** proposta
  (falta definir quem faz a curadoria; ver `10-pendencias.md`)

## DEC-06 — Títulos descritivos, nunca conclusivos
- **Exemplo:** ✅ "Presença em sessões deliberativas, 2025" · ❌ "Deputado faltou muito"
- **Princípio:** PRI-06 · **Ref:** REF-14 · **Status:** aceita

## DEC-07 — Dado bruto a no máximo 1 clique
- **Princípio:** PRI-07 · **Ref:** REF-03, REF-12 · **Status:** aceita

## DEC-08 — Cards compartilháveis por métrica
- **Princípio:** PRI-08 · **Ref:** REF-01 · **Status:** aceita

## DEC-09 — TypeScript em todo o projeto (web e ingestão)
- **Motivo:** uma linguagem só no repositório; DuckDB para arquivos grandes.
- **Detalhe:** `11-arquitetura.md` · **Status:** aceita (2026-11-13)

## DEC-10 — Proveniência obrigatória em todo dado
- **Regra:** todo registro, em todas as camadas, sabe **quando**, **onde** e **como** foi
  obtido. Dado sem proveniência não entra no banco.
- **Princípio:** PRI-07 · **Detalhe:** `11-arquitetura.md#proveniência` · **Status:**
  aceita (2026-11-13)

## DEC-11 — MVP com 4 perguntas, só dados da Câmara
- Identidade, presença (MET-01), cota (MET-02), funil de projetos (MET-03), cada uma com
  comparação sem ranking.
- **Detalhe:** `01-visao.md#mvp` · **Status:** aceita (2026-11-13)

## DEC-12 — Static-first e API pública somente leitura
- **Motivo:** segurança e desempenho com a mesma decisão.
- **Detalhe:** `13-seguranca.md` (SEG-01..03) · **Status:** proposta

## DEC-13 — Guardrails de desempenho e segurança no CI
- **Motivo:** código gerado por IA precisa de barreiras automáticas; a revisão humana não
  escala.
- **Detalhe:** `12-observabilidade.md#obs-06`, `13-seguranca.md#seg-07`,
  `14-barreiras-ci.md` · **Ref:** REF-23, REF-24, REF-25 · **Status:** aceita
  (2026-11-13) para as barreiras de segurança (cadeia de suprimentos, segredos,
  framework). Os orçamentos de desempenho (OBS-06) ainda são proposta.

## DEC-14 — Convenções de interface: Tailwind CSS v4 + padrões do shadcn/ui
- **Decisão (2026-11-13, pedido do usuário):** a interface segue convenções prontas e
  conhecidas em vez de um CSS próprio:
  - **Estilo:** Tailwind CSS v4 (classes utilitárias, escala de 4 px, escala tipográfica e
    breakpoints padrão). Só roda no build: nenhum JavaScript vai para o navegador.
  - **Tokens:** os nomes do shadcn/ui (`background`, `foreground`, `card`, `primary`,
    `muted`, `accent`, `border`, `input`, `ring`, `radius`) em `apps/web/app/globals.css`.
    Cores de gráfico em tokens próprios (`deputado`, `referencia`, `distribuicao`), nunca a
    cor da marca (DSG-04).
  - **Componentes:** padrões do shadcn/ui (Card, Badge, Button, Input, Table, Command)
    escritos dentro do projeto em `apps/web/componentes/ui.tsx`, **sem** instalar a
    biblioteca nem o Radix (menos dependências, regra 2).
  - **Ícones:** estilo Lucide (traço 2 px, 24×24), em SVG próprio.
  - **Acessibilidade e conteúdo:** WAI-ARIA APG + WCAG 2.2 AA (REF-18, REF-30); redação
    no padrão GOV.UK/linguagem simples (REF-20, REF-21).
- **Por que não Bootstrap:** traz JavaScript de componentes (conflita com a CSP e com o
  static-first), visual reconhecível que pede sobrescrita, menor adoção no ecossistema Next.
- **Dependências novas:** `tailwindcss` e `@tailwindcss/postcss` 4.3.4 (dev), aprovadas em
  `security/dependencias-aprovadas.json`; `pnpm audit` sem vulnerabilidades. Binários nativos
  do `@tailwindcss/oxide` vêm como pacotes opcionais por plataforma, sem script de instalação.
- **Princípio:** PRI-06, PRI-07 · **Status:** aceita

