# 01 — Visão

## Problema

Os dados sobre deputados (presença, votos, gastos, projetos, doações) são públicos,
mas estão espalhados, em formato técnico e sem contexto. Quem não tem letramento de
dados não consegue usá-los (REF-11, REF-12).

## Público-alvo

Cidadão médio, acessando principalmente pelo celular, sem familiaridade com dados ou
estatística. Público secundário: jornalistas, pesquisadores e auditores, que usam a
camada de dado bruto.

## Escopo

- Deputados federais da legislatura atual (primeira fase).
- Entrada pelo CEP/UF ou pelo nome do deputado (REF-12).
- Métricas objetivas e contextualizadas (ver `04-metricas.md`).
- Para toda informação facilitada: dado bruto + fonte oficial + data de coleta + método.

## MVP (fechado em 2026-11-13)

Quatro perguntas, todas respondidas só com dados da Câmara (SRC-01, 01b, 01c):

| # | Pergunta do cidadão | Métrica | Comparação |
|---|---|---|---|
| 1 | Quem é meu deputado? | identidade, partido, UF, comissões | — |
| 2 | Ele vai trabalhar? | MET-01 presença | mediana da Câmara |
| 3 | Como ele gasta a cota? | MET-02 CEAP | média da mesma UF |
| 4 | Que projetos ele apresenta e quantos avançam? | MET-03 funil legislativo | mediana da Câmara por estágio |

- A comparação com os outros deputados existe, mas **sem ranking** (DEC-01): mostra a
  posição do deputado em relação à mediana/faixa, nunca "1º de 513".
- Fica fora do MVP: TSE, emendas, sanções, CNPJ, processos.

## Fora do escopo

- **Nota única, ranking geral ou selo de "bom/mau deputado".** O portal informa, o
  cidadão conclui (PRI-01).
- Opinião editorial, adjetivos avaliativos e recomendação de voto.
- Inferir intenção a partir de correlação (ex.: doação × voto não é apresentado como
  "compra de voto").

## Hipótese de impacto

Informação só muda comportamento quando chega à pessoa por um canal que ela já usa
(REF-01). Por isso o formato compartilhável é requisito, não enfeite (DEC-08).
