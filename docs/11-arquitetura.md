# 11 — Arquitetura

Status: **proposta** (aguardando decisão do time). Quando aceita, vira DEC-09.

## Objetivo
Não depender das APIs públicas em tempo de requisição. As fontes caem, mudam de versão,
limitam requisições e apagam dados. A aplicação só lê do **nosso** banco, e o banco é
alimentado por coletores.

## Proposta: monolito modular em monorepo

```
apps/
  web/        Next.js — páginas + API de leitura (route handlers) sobre o nosso banco
  ingest/     coletores + transformações; roda por agendamento (cron), fora do Next
packages/
  db/         schema e migrations (fonte única dos tipos)
  metrics/    cálculo das métricas (MET-xx), puro e testável, usado pelo ingest
  sources/    um cliente por SRC-xx (paginação, retry, rate limit)
```

### Por que não "tudo dentro do Next"
- Carga pesada não cabe em request/serverless: CNPJ da Receita (dezenas de GB), ZIPs
  anuais da CEAP, histórico de votações.
- Retry, rate limit (Portal da Transparência) e reprocessamento são trabalho de worker,
  não de rota HTTP.
- Separar o processo de ingestão não exige microserviço: é um segundo `app` no mesmo
  repositório, com o mesmo banco e os mesmos tipos.

### Por que não microserviços
- O time é pequeno, há um só domínio e um só banco. Microserviços só adicionam custo
  operacional. A extração fica possível depois, porque `apps/web` já expõe uma API.

## Camadas de dados (alinhado a PRI-07)

| Camada | Conteúdo | Para quê |
|---|---|---|
| `raw` | payload exatamente como veio + metadados de coleta | auditoria, reprocessamento, prova |
| `staging` | normalizado por fonte (tipos, códigos) | limpeza |
| `core` | entidades unificadas (deputado, votação, despesa, fornecedor) | casamento entre fontes |
| `metrics` | MET-xx calculadas, com `versao_metodo` | o que o app exibe |

- `raw` em armazenamento de objetos (S3 compatível) com snapshot datado. As demais
  camadas em PostgreSQL.
- Arquivos grandes (CNPJ, CEAP) processados com DuckDB antes de carregar no Postgres.

## Nossa API
- Somente leitura, versionada (`/api/v1/...`), documentada em OpenAPI.
- Toda resposta de métrica traz um bloco `proveniencia`: fonte, URL de origem, coletado
  em, versão do método, link para o dado bruto.
- Endpoint de dado bruto/exportação (CSV/JSON) para auditores (DEC-07).

## Proveniência

DEC-10. Duas estruturas: a **coleta** (o evento de buscar) e o **vínculo** de cada
registro com a coleta que o gerou.

### `coleta` (uma linha por execução de coletor)
| Campo | Descrição |
|---|---|
| `id` | identificador da coleta |
| `fonte_id` | SRC-xx |
| `url_requisitada` | URL exata, com query string (sem a chave de API) |
| `metodo` | `api` / `arquivo` |
| `iniciada_em` / `finalizada_em` | timestamps UTC |
| `status_http` / `status` | resultado (`sucesso`, `parcial`, `falha`) |
| `hash_conteudo` | SHA-256 do payload bruto (prova de integridade) |
| `caminho_raw` | onde o payload bruto está guardado (snapshot) |
| `versao_coletor` | commit/versão do código que coletou |
| `registros` | quantidade obtida |
| `erro` | mensagem, se houver |

### Em todo registro de `staging`, `core` e `metrics`
- `coleta_id` (de onde veio), `obtido_em`, `fonte_id`, `url_origem_publica` (link que o
  usuário pode abrir para conferir).
- Em `metrics`: também `versao_metodo` e a lista de `coleta_id` usados no cálculo.

### Regras
- Coleta é **append-only**: nunca se sobrescreve um payload bruto. Uma nova coleta gera um
  novo snapshot.
- Mudança de valor entre coletas fica registrada (histórico), sem atualizar no lugar.
- Toda resposta da API leva um bloco `proveniencia` montado a partir desses campos.

### Implementação (SRC-01, 2026-11-13)
- **Uma coleta por execução**, não por página: `url_requisitada` é a lista pedida e o
  pacote bruto guarda cada página (URL exata, status, cabeçalhos relevantes e o corpo
  original como texto).
- **`raw` endereçado por conteúdo:** `<fonte>/<AAAA-MM-DD>/<sha256>.json.gz`. O nome é o
  `hash_conteudo`; arquivo nunca é sobrescrito (`link()` falha se já existe) e a leitura
  confere o hash. Localmente em `data/raw/` (`RAW_DIR` sobrescreve); S3 depois, pela mesma
  interface (`apps/ingest/src/raw.ts`).
- O bruto é salvo **mesmo quando a coleta falha**, para diagnóstico.
- **Só coleta com `sucesso` atualiza o `core`.** O total é conferido contra o
  `X-Total-Count` da própria Câmara; divergência vira `parcial` (grava staging, não mexe
  no core). Deputado que sai da lista fica no core com `em_exercicio = false`.
- `staging` é append-only (trigger), e é ele que guarda o histórico; o `core` é o estado
  atual e aponta para a coleta que o produziu.
- Validação estrita do que vem da fonte (SEG-06): formato inesperado é falha da coleta,
  nunca "melhor esforço". Link de próxima página só é seguido se for da própria API.

### Implementação (MET-01 e MET-02, 2026-11-13)
- **Uma coleta por dia** de frequência (SRC-01d): cada dia é uma requisição independente e
  lenta, e a coleta de um dia pode falhar sem invalidar as outras.
- **Arquivo oficial no `raw` byte a byte** (CEAP, ZIP): o `hash_conteudo` é o SHA-256 do
  próprio arquivo da Câmara, e qualquer pessoa pode baixá-lo e conferir. Se o arquivo é
  idêntico ao da coleta vigente, a coleta é registrada sem duplicar as ~200 mil linhas.
- **`core.coleta_vigente`**: para conjuntos grandes (CEAP, histórico), o core não copia o
  staging; aponta qual coleta vale, e as leituras filtram o staging por ela.
- **`metrics.calculo`**: cada execução de cálculo é um registro append-only com a métrica,
  a versão do método, o período e a lista de `coleta_id` usados. As tabelas de cada
  métrica referenciam o cálculo; um número publicado nunca muda.
- Leitores sem dependência (`packages/sources`): XML estrito (sem DOCTYPE/entidades),
  ZIP (deflate, com limite contra zip bomb) e CSV em fluxo.

## Ambiente local
Pré-requisitos: Node 24, pnpm e Docker (sem compose).

```
pnpm install
pnpm db:up       # Postgres 18 em 127.0.0.1:54329; cria .env com senha aleatória
pnpm db:migrar   # aplica packages/db/migrations em ordem (registro em schema_migrations)
pnpm coletar     # todas as etapas; ou só algumas: pnpm coletar deputados met01
                 #   deputados → eventos → matriculas → presenca → met01
                 #   → historico → ceap → met02 → proposicoes → met03
                 # (a 1ª carga da presença leva ~25 min: o webservice é lento)
pnpm test        # node:test, sem banco nem rede
pnpm db:down     # para o container (dados ficam no volume)
```

- Migration aplicada não pode ser editada: o runner compara o SHA-256 e para.
- Apagar o banco local: `node scripts/dev/db-local.mjs reset --sim`.

## Pontos em aberto
- [x] Linguagem: TypeScript (DEC-09).
- [ ] Hospedagem e orçamento (afeta a escolha de cron/worker).
- [ ] Política de retenção dos snapshots `raw`.
