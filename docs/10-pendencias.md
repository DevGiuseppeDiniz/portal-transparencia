# 10 — Pendências e próximos passos

## Referências: lacunas conhecidas (resolver só no momento de uso)
Seguir a regra de uso de referências do `plan.md`: nenhuma pesquisa antecipada.
- DSG-10 não tem referência específica para incerteza e dado faltante. Buscar quando
  DSG-10 for implementado.
- REF-20 (linguagem simples): o número da lei precisa ser confirmado quando DSG-07 for
  aplicado.
- Autores/volume/páginas marcados `[de memória]` em `08-referencias.md` são confirmados
  quando o `REF-xx` correspondente for lido na íntegra.

## Pendências técnicas do esqueleto (2026-11-13)
- [x] Driver do PostgreSQL: `postgres@3.4.9`, sem query builder; runner de migrations
      próprio (`packages/db/src/migrar.ts`). Feito em 2026-11-13.
- [ ] Migrar `postgres` para a 4.x quando a major amadurecer (4.0.0 é de 29/10/2026).
- [ ] Credenciais separadas por papel: hoje, localmente, migrations e ingestão usam o mesmo
      usuário dono do banco. Em produção: usuário de migration ≠ usuário LOGIN com o papel
      `portal_ingest` ≠ usuário LOGIN com `portal_web` (SEG-02, SEG-03).
- [ ] Teste de integração do coletor contra um Postgres de verdade no CI (service container).
- [ ] CSP sem `'unsafe-inline'` em `script-src` (hashes ou nonce). O nonce força
      renderização dinâmica, o que conflita com o static-first (DEC-12): avaliar hashes.
- [ ] Migrar para TypeScript 7 (compilador nativo) quando o Next suportar oficialmente.
- [x] Testes: `node:test` nativo (`pnpm test`), rodando no CI. Feito em 2026-11-13.

- [ ] MET-01: confirmar com a Câmara (LAI) o significado de "Presença (~)" na frequência
      do webservice. Hoje é tratada pelo Ato da Mesa 191/2017 (ata prevalece).
- [ ] MET-01: deputados com matrícula fora do `ObterDeputados` (ex-deputados) não são
      mapeados; só importa se um dia a MET-01 cobrir quem saiu.
- [ ] Endpoint público de dado bruto (DEC-07): o ZIP oficial da CEAP contém CPF do deputado
      e nome de passageiros. Decidir se o portal redistribui o arquivo ou só aponta o link
      oficial + hash (recomendado).
- [ ] Agendamento (cron) das coletas: frequência diária; CEAP diária (o arquivo do ano muda
      todo dia); histórico semanal.

- [ ] MET-03: destino das apensadas (o principal virou lei?). O vínculo `uriPropPrincipal`
      some com a desapensação; caminho provável: o texto do despacho de apensação.
- [ ] MET-03: relatoria (REF-28; ler a tese antes) e coautoria.
- [ ] MET-03: ajuste por "valor esperado" (cargo, senioridade; PRI-03) e janelas de tempo
      iguais (projeto recente ainda não teve tempo de avançar).
- [ ] Staging cresce a cada arquivo novo (proposições/CEAP mudam todo dia): política de
      retenção ou de deduplicação por registro.

- [ ] Site: entrada por CEP (DEC-02) exige uma base CEP → UF; hoje a entrada é por nome
      ou estado. Sem chamar serviço externo no navegador (privacidade).
- [ ] Site: cards compartilháveis (DEC-08, DSG-09) — validar REF-01 antes.
- [ ] Site: URL com nome (`/deputado/nome-uf`) para buscadores (parecer REF-08) e busca
      tolerante a erro de digitação.
- [ ] Site: CSP sem `'unsafe-inline'` (já listado) e deploy com `needs: portao-producao`.
- [ ] Leitura integral pendente: REF-09, REF-10 (texto fechado), REF-17 (original),
      REF-18 (WCAG/NBR 17225 inteira), REF-28 (tese).

## Decisões em aberto
- [ ] DEC-05: quem faz a curadoria dos temas de votação? (conselho plural? academia?
      só o usuário?)
- [ ] MET-06: fonte oficial confiável e consolidada para processos/condenações.
- [ ] Métrica de emendas parlamentares (SRC-03): incluir na fase 1?
- [ ] Ajuste "valor esperado" de MET-03: que variáveis usar no contexto da Câmara?
- [ ] Modelo de sustentabilidade (ONG, financiamento coletivo, universidade, fundações).

## Próximos passos (ordem)
1. **Escopo do MVP:** fechar as 3 perguntas centrais do cidadão. Proposta: "quem é meu
   deputado?", "ele vai trabalhar?" (MET-01) e "como ele gasta a cota?" (MET-02). Tudo vem
   da Câmara (SRC-01/01b/01c), sem cadastro e sem casamento entre fontes.
2. **Esqueleto do monorepo** (`apps/web`, `apps/ingest`, `packages/db|sources|metrics`)
   com o schema de proveniência (`11-arquitetura.md#proveniência`).
3. ~~**Primeiro coletor (SRC-01, deputados):** valida o fluxo raw → staging → core com
   proveniência de ponta a ponta.~~ Feito em 2026-11-13 (`pnpm coletar`).
4. ~~Coletores de presença e de CEAP, e cálculo de MET-01/MET-02.~~ Feito em 2026-11-13.
5. ~~Tela do deputado (busca por UF/nome) + página de auditoria.~~ Feito em 2026-11-13: MVP
   completo (MET-01, MET-02, MET-03 e site estático).
6. Teste de compreensão com 5–10 pessoas fora da bolha técnica (checklist de
   `06-auditoria.md`). Antes de aplicar DSG/PRI, validar as REF usadas (regra do
   `plan.md`).
7. Depois: TSE (MET-05) e o casamento Câmara ↔ TSE; sanções e CNPJ.
