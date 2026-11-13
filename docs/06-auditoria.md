# 06 — Transparência e auditoria

Princípio base: PRI-07. O usuário sempre pode sair do dado facilitado e chegar à fonte.

## Camadas de cada informação

1. **Facilitada:** o card ("Presença: 87%, mediana da Câmara 91%").
2. **Método:** como foi calculado, com fórmula em texto simples e link para o código.
3. **Dado bruto:** a tabela exata usada no cálculo, para download (CSV/JSON).
4. **Fonte oficial:** link para o endpoint/arquivo original (SRC-xx) e data da coleta.

## Rastreabilidade

- Cada registro guarda: `fonte`, `url_origem`, `coletado_em`, `versao_metodo`.
- Snapshots versionados das coletas (dados públicos mudam ou somem).
- Código de coleta e de cálculo aberto (repositório público).

## Página "como escolhemos"

- Para toda curadoria (temas de votação, tipos de proposição filtrados): critério,
  responsável, data e histórico de mudanças (PRI-05).
- Canal público para contestar a curadoria.

## Checklist anti-enquadramento (revisão antes de publicar)

- [ ] O título descreve, sem avaliar? (REF-14)
- [ ] Há referência de comparação neutra? (REF-09)
- [ ] O agrupamento padrão não é por partido? (REF-15)
- [ ] A cor não codifica bom/ruim? (REF-13)
- [ ] O dado faltante aparece como faltante, não como zero?
- [ ] O dado bruto e a fonte estão a 1 clique?
- [ ] Alguma frase sugere causalidade a partir de correlação?

## Correções

- Erros corrigidos publicamente, com registro (errata) e data.
