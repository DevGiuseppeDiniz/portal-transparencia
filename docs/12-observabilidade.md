# 12 — Observabilidade e desempenho

Contexto: projeto feito com muito código gerado por IA ("vibecoding"). A IA tende a
escolhas que funcionam mas custam caro: N+1 queries, falta de índice, bundle inchado,
fetch em cascata, cache ausente. **Métrica é o que pega isso**, porque revisão humana
não acompanha o volume de código.

Duas frentes: **orçamentos no CI** (barram antes do merge) e **telemetria em produção**
(mostram o que escapou).

## OBS-01 — Padrão: OpenTelemetry
- Traces, métricas e logs via OpenTelemetry (padrão aberto, sem prender a um fornecedor).
- O backend de visualização é decidido junto com a hospedagem (`11-arquitetura.md`).
- Logs estruturados (JSON) com `trace_id` em tudo.

## OBS-02 — Web (o que o cidadão sente)
| Métrica | Alvo inicial | Onde |
|---|---|---|
| LCP | ≤ 2,5 s (p75, mobile) | RUM + Lighthouse CI |
| INP | ≤ 200 ms (p75) | RUM |
| CLS | ≤ 0,1 (p75) | RUM + Lighthouse CI |
| JS enviado por rota | orçamento por rota (definir no esqueleto) | build |
| Cache hit rate da CDN | acompanhar | CDN |

Os limiares de LCP/INP/CLS são os "bons" do Core Web Vitals do Google `[de memória;
confirmar ao implementar]`. Medir em celular de entrada e 4G lenta: é o público (01-visao).

## OBS-03 — API
- Latência p50/p95/p99 **por rota**, taxa de erro (4xx/5xx), requisições/s.
- Tamanho da resposta por rota (a IA costuma devolver o objeto inteiro).
- Taxa de acerto de cache.

## OBS-04 — Banco
- `pg_stat_statements` ligado desde o primeiro dia: top queries por tempo total e por
  chamada.
- Log de query lenta (limiar inicial: 100 ms).
- Contagem de queries por requisição (detecta N+1).

## OBS-05 — Ingestão
Por coleta (dados já vêm da tabela `coleta`, DEC-10):
- duração, registros/s, bytes baixados, retries, respostas 429 (limite), falhas.
- **Frescor**: idade do dado mais recente por fonte. Alerta se passar do esperado.
- **Volume anômalo**: queda/salto de registros em relação à coleta anterior (fonte mudou
  formato ou apagou dados).

## OBS-06 — Guardrails no CI (barram o merge)
- `tsc --strict` sem erros, lint, testes.
- Lighthouse CI com orçamento (LCP, CLS, peso por rota).
- Orçamento de bundle por rota.
- Teste de carga curto (k6) nas rotas principais, com limite de p95.
- Teste que conta queries por rota (falha se passar do limite).
- Dependência nova exige justificativa (ver SEG-05).

## OBS-07 — Revisão periódica
- Semanal: top 10 queries lentas, rotas mais lentas, maior bundle. Cada item vira tarefa
  ou é marcado como aceito.
