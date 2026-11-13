# plan.md — índice do Portal Parlamentar

> **Para agentes:** este arquivo é um dicionário. Ache a chave da pergunta abaixo,
> abra **só** o arquivo e o header indicados. Não leia tudo.
> IDs são estáveis: `PRI-xx` (princípio), `DEC-xx` (decisão), `MET-xx` (métrica),
> `DSG-xx` (regra de design), `REF-xx` (referência), `SRC-xx` (fonte de dados).

## Resumo em 3 linhas

Portal que expõe dados públicos de deputados federais de forma legível para a
população média, **sem nota, sem ranking e sem conclusão editorial**. Toda informação
facilitada tem link para o dado bruto e para a fonte oficial, para que qualquer um audite.

## Dicionário

| Pergunta / chave | Arquivo → header | IDs |
|---|---|---|
| O que é o projeto, para quem, o que **não** é | `docs/01-visao.md` → `## Escopo` / `## Fora do escopo` | — |
| Por que apresentamos assim (fundamento científico) | `docs/02-principios.md` | PRI-01..PRI-08 |
| Decisões tomadas e a referência de cada uma | `docs/03-decisoes.md` | DEC-01.. |
| Quais métricas mostrar e como calcular | `docs/04-metricas.md` | MET-01.. |
| Regras de design e visualização | `docs/05-design.md` | DSG-01.. |
| Transparência, dado bruto, auditoria | `docs/06-auditoria.md` | — |
| De onde vêm os dados (catálogo de fontes) | `docs/07-fontes-de-dados.md` | SRC-01.. |
| Fontes de um cargo específico (endpoints, limites, status) | `docs/fontes/<cargo>.md` → `## SRC-xx` | SRC-xx |
| Arquitetura (monorepo, ingestão, camadas, nossa API) | `docs/11-arquitetura.md` | — |
| Rodar localmente (banco, migrations, coletor, testes) | `docs/11-arquitetura.md` → `## Ambiente local` | — |
| Métricas de desempenho, telemetria, guardrails de CI | `docs/12-observabilidade.md` | OBS-01.. |
| Segurança (modelo de ameaça, regras) | `docs/13-seguranca.md` | SEG-01.. |
| Barreiras de CI: o que bloqueia, como adicionar dependência/segredo, patch urgente | `docs/14-barreiras-ci.md` | DEC-13 |
| Escopo do MVP | `docs/01-visao.md` → `## MVP` | DEC-11 |
| Artigos e estudos citados | `docs/08-referencias.md` → `## REF-xx` | REF-01.. |
| Projetos parecidos no mundo | `docs/09-benchmarks.md` | — |
| Perguntas em aberto / próximos passos | `docs/10-pendencias.md` | — |

## Código (onde fica o quê)

| Caminho | Conteúdo |
|---|---|
| `apps/web` | Next.js estático: lê só o snapshot `data/publicado` (sem banco, DEC-12); `exemplo/` = dados fictícios do CI |
| `apps/ingest` | coletores agendados + armazenamento `raw`; Node 24 roda o TS direto |
| `packages/db` | tipos + `migrations/` (proveniência, DEC-10) |
| `packages/sources` | catálogo e clientes das fontes (`SRC-xx`) |
| `packages/metrics` | cálculo puro das métricas (`MET-xx`) |
| `scripts/ci`, `security/` | barreiras de CI (`docs/14-barreiras-ci.md`) |
| `scripts/dev` | Postgres local via Docker (`pnpm db:up`) |

## Convenções

- Toda regra em `02`–`06` cita pelo menos um `REF-xx`. Regra sem referência é marcada
  `[sem-ref]` e vai para `10-pendencias.md`.
- Status das referências em `08`: `verificado-resumo` (lido abstract/resumo),
  `verificado-integral` (lido o texto completo), `de-memória` (precisa conferir).
- Idioma: pt-BR. Identificadores de API preservam a grafia original.

## Regra de uso de referências (obrigatória)

**Validação no momento de uso.** Antes de aplicar um `REF-xx` numa implementação ou
decisão:

1. Ler o estudo **na íntegra**, não só o resumo.
2. Validar se o achado sustenta o uso pretendido (contexto, amostra, limitações).
3. Pesquisar o que veio depois: replicações, críticas, estudos que o contradizem.
4. Atualizar o header do `REF-xx` em `08-referencias.md`: status
   `verificado-integral`, data, e o que foi confirmado ou corrigido.

**Sem pesquisa antecipada.** Não validar nem pesquisar referências fora do momento de
uso; isso evita pesquisa não direcionada. Até lá, o status atual (`verificado-resumo` /
`de-memória`) só indica de onde a referência veio. Não é aval para aplicá-la.
