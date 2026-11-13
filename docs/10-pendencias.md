# 10 — Pendências e próximos passos

## Referências: lacunas conhecidas (resolver só no momento de uso)
Seguir a regra de uso de referências do `plan.md`: nenhuma pesquisa antecipada.
- DSG-10 não tem referência específica para incerteza e dado faltante. Buscar quando
  DSG-10 for implementado.
- REF-20 (linguagem simples): o número da lei precisa ser confirmado quando DSG-07 for
  aplicado.
- Autores/volume/páginas marcados `[de memória]` em `08-referencias.md` são confirmados
  quando o `REF-xx` correspondente for lido na íntegra.

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
3. **Primeiro coletor (SRC-01, deputados):** valida o fluxo raw → staging → core com
   proveniência de ponta a ponta.
4. Coletores de presença e de CEAP, e cálculo de MET-01/MET-02.
5. Tela do deputado (busca por UF/nome) + página de auditoria.
6. Teste de compreensão com 5–10 pessoas fora da bolha técnica (checklist de
   `06-auditoria.md`). Antes de aplicar DSG/PRI, validar as REF usadas (regra do
   `plan.md`).
7. Depois: TSE (MET-05) e o casamento Câmara ↔ TSE; sanções e CNPJ.
