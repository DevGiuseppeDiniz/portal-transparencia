# 07 — Fontes de dados (índice)

> Uma página por cargo em `docs/fontes/`. Este arquivo só lista as fontes (`SRC-xx`) e
> aponta onde cada uma está detalhada. Os IDs são globais: a mesma fonte usada por vários
> cargos tem um único SRC.

## Por cargo

| Cargo | Arquivo | Status |
|---|---|---|
| Deputado federal | `docs/fontes/deputado-federal.md` | levantado em 2026-11-13 |
| Senador | — | pendente |
| Deputado estadual | — | pendente (cada Assembleia tem um portal próprio) |
| Vereador / prefeito / governador | — | pendente |

## Catálogo de fontes

| ID | Fonte | Acesso | Auth | Detalhe |
|---|---|---|---|---|
| SRC-01 | Câmara — API v2 | REST JSON/XML | não | `fontes/deputado-federal.md#src-01` |
| SRC-01b | Câmara — arquivos em massa | download | não | `fontes/deputado-federal.md#src-01b` |
| SRC-01c | Câmara — CEAP (cota) | download anual | não | `fontes/deputado-federal.md#src-01c` |
| SRC-01d | Câmara — webservices legados (frequência) | XML (SitCamaraWS) | não | `fontes/deputado-federal.md#src-01d` |
| SRC-02 | TSE — Portal de Dados Abertos | CKAN + download | não | `fontes/deputado-federal.md#src-02` |
| SRC-02b | TSE — DivulgaCandContas | consulta web | não | `fontes/deputado-federal.md#src-02b` |
| SRC-03 | CGU — Portal da Transparência API | REST | chave (cadastro) | `fontes/deputado-federal.md#src-03` |
| SRC-04 | Receita Federal — CNPJ | download | não | `fontes/deputado-federal.md#src-04` |
| SRC-05 | Base dos Dados | BigQuery / pacotes | conta Google | `fontes/deputado-federal.md#src-05` |
| SRC-06 | CNJ — DataJud API Pública | REST (Elasticsearch) | chave pública | `fontes/deputado-federal.md#src-06` |
| SRC-07 | STF — Corte Aberta | CSV / painéis | não | `fontes/deputado-federal.md#src-07` |
| SRC-08 | TCU — contas julgadas irregulares (Cadirreg) | consulta web / CSV | não | `fontes/deputado-federal.md#src-08` |
| SRC-09 | Transferegov — emendas / transferências especiais | API / painéis | a verificar | `fontes/deputado-federal.md#src-09` |
| SRC-10 | Tesouro Transparente — emendas | CKAN | não | `fontes/deputado-federal.md#src-10` |

## Custo de acesso

Todas as fontes oficiais são gratuitas. Diferenças:

| Fonte | Custo | Condição |
|---|---|---|
| SRC-01, 01b, 01c, 01d (Câmara) | grátis | sem cadastro |
| SRC-02 (TSE) | grátis | sem cadastro |
| SRC-03 (Portal da Transparência) | grátis | cadastro de e-mail para obter a chave; limite de requisições por minuto |
| SRC-04 (Receita CNPJ) | grátis | sem cadastro; o custo real é armazenamento/processamento |
| SRC-05 (Base dos Dados) | grátis até a cota | BigQuery: cobra acima da cota gratuita mensal do Google Cloud (`[valor a verificar]`) |
| SRC-06 (DataJud) | grátis | chave pública + aceitar os termos de uso |
| SRC-07, 08, 09, 10 | grátis | sem cadastro |

## Regras para toda fonte

- Guardar o **payload bruto** de cada coleta (camada `raw`) antes de transformar (PRI-07).
- Registrar `fonte`, `url_origem`, `coletado_em`, `versao_coletor` em cada registro.
- Fonte sem API documentada: coletar só via arquivo oficial, nunca por scraping de HTML
  sem antes registrar a decisão em `03-decisoes.md`.
- O usuário final nunca consome a fonte diretamente: tudo passa pela nossa API
  (ver `11-arquitetura.md`).
