# 13 — Segurança

## Modelo de ameaça (o que realmente importa aqui)

O site não tem login nem pagamento, mas **não está livre de risco**. Os riscos reais:

| # | Ameaça | Impacto |
|---|---|---|
| T1 | **Adulteração de dados** (alguém altera números de um deputado) | o maior risco: dano político e de credibilidade, e o projeto perde o motivo de existir |
| T2 | Abuso da API pública (scraping massivo, DoS) | custo e indisponibilidade |
| T3 | Injeção (SQL, XSS vindo de texto das fontes: nomes, ementas) | vazamento/adulteração, ataque ao visitante |
| T4 | Vazamento de segredos (chave do Portal da Transparência, credencial do banco) | abuso em nosso nome, acesso ao banco |
| T5 | Dependência maliciosa ou inexistente sugerida pela IA (*slopsquatting*) | execução de código no build/servidor |
| T6 | Vulnerabilidade do framework (Next.js / React Server Components) | execução remota mesmo em site "estático" |
| T7 | Painel de curadoria futuro (DEC-05) | primeiro ponto com login e escrita |

## Sobre "não deixar as APIs abertas para uso externo"

Ajuda, mas **não basta**, e uma parte disso não é possível:
- A API de leitura que o navegador consome é **pública por natureza**: qualquer um vê as
  chamadas no DevTools. Não dá para escondê-la. Dá para torná-la barata de servir e
  inofensiva (SEG-01, SEG-02).
- O que **não pode** ser exposto é tudo o que escreve: banco, coletores, painel. Esses
  ficam fora da internet pública (SEG-03).
- As métricas (12-observabilidade) **detectam** o comportamento estranho, mas não o
  impedem. São a segunda linha.

## SEG-01 — Static-first
- Páginas de deputado geradas estaticamente/ISR e servidas por CDN. O tráfego do
  cidadão quase nunca toca o servidor nem o banco.
- A API pública devolve JSON cacheável na CDN.
- **Efeito:** reduz a superfície de ataque (T2, T6) e é também a maior otimização de
  desempenho.

## SEG-02 — API pública somente leitura
- Só `GET`. Nenhuma rota de escrita no `apps/web`. Server Actions desabilitadas/não usadas.
- Usuário do banco do `web` com permissão **apenas de SELECT** nas views de `metrics`/`core`.
- Validação de todo parâmetro com schema (ex.: Zod). Queries sempre parametrizadas
  (ORM/query builder), nunca string concatenada.
- Rate limit por IP na borda (CDN/WAF). Paginação com limite máximo.
- Respostas sem dados internos (sem stack trace, sem IDs internos desnecessários).

## SEG-03 — Escrita isolada
- Banco sem IP público. Só `apps/ingest` escreve, com credencial própria.
- `apps/ingest` não expõe porta HTTP; roda como job agendado.
- Segredos só em variáveis de ambiente do servidor/cofre. **Nunca** com prefixo
  `NEXT_PUBLIC_`. Secret scanning no CI.

## SEG-04 — Integridade dos dados (contra T1)
- Payload bruto imutável com `hash_conteudo` (DEC-10): qualquer número exibido pode ser
  recalculado a partir da fonte e comparado.
- Página de auditoria (06-auditoria) com o link da fonte oficial: o próprio público
  detecta divergências.
- Job de verificação: recalcula amostras das métricas a partir do `raw` e compara.
- Log de toda alteração em `core`/`metrics` (quem, quando, qual coleta).

## SEG-05 — Cadeia de dependências (contra T5, T6)
- Lockfile commitado; `npm ci` no build.
- Dependência nova: conferir que existe, mantenedor, downloads e idade **antes** de
  instalar. A IA pode inventar nomes de pacote.
- `npm audit` / Dependabot (ou Renovate) no CI. Atualização rápida de patches de
  segurança do Next.js/React.
- Desabilitar scripts de instalação de pacotes quando possível.

## SEG-06 — Conteúdo vindo das fontes é não confiável (contra T3)
- Todo texto das fontes (nomes, ementas, fornecedores) é renderizado como texto, nunca
  como HTML. Proibido `dangerouslySetInnerHTML` com dado de fonte.
- Headers: CSP restritiva, `X-Content-Type-Options`, `Referrer-Policy`, HSTS.

## SEG-07 — Guardrails de revisão para código gerado por IA
- Checklist de PR: rota nova é GET? tem validação? usa query parametrizada? expõe
  segredo? adiciona dependência?
- SAST no CI (ex.: Semgrep / CodeQL) e lint de segurança.
- Revisão humana obrigatória em: `packages/db`, autenticação (futura), headers/CSP,
  configuração de CDN/WAF.

## SEG-08 — Quando surgir login (painel de curadoria)
- Revisar este documento **antes** de implementar. O painel fica fora do domínio público,
  com MFA e trilha de auditoria.

## Referências
Vibe coding: REF-23 (arXiv, auditoria de apps gerados por agentes), REF-24 (CSA),
REF-25 (IBM), REF-26 (Databricks). Implementação das barreiras: `14-barreiras-ci.md`.

Base técnica sugerida (validar no momento de uso, regra do `plan.md`): OWASP Top 10,
OWASP ASVS, OWASP API Security Top 10. `[de-memória]`
