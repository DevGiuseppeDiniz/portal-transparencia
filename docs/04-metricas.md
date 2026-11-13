# 04 — Métricas

Cada métrica: o que mede · cálculo · comparação de referência · armadilhas · fonte · refs.
Classe: **objetiva** (fato verificável) ou **curada** (depende de seleção humana, PRI-05).

## MET-01 — Presença em sessões deliberativas
- **Classe:** objetiva
- **Cálculo:** presenças ÷ sessões deliberativas no período. Ausências justificadas são
  exibidas à parte, não somadas.
- **Referência:** mediana da Câmara e faixa interquartil (PRI-02).
- **Armadilhas:** obstrução e licenças (saúde, cargo no Executivo). Mostrar o motivo.
- **Fonte:** SRC-01 · **Refs:** REF-09, REF-10

## MET-02 — Uso da cota parlamentar (CEAP)
- **Classe:** objetiva
- **Cálculo:** gasto no período ÷ teto da UF. Detalhar por categoria e por fornecedor.
- **Referência:** média dos deputados da **mesma UF** (o teto varia por UF; PRI-03).
- **Sinais auditáveis (sem acusar):** concentração em poucos fornecedores, fornecedor com
  CNPJ aberto pouco antes do primeiro pagamento. Exibir como dado, sem rótulo de
  irregularidade.
- **Armadilhas:** gastar pouco não é sinônimo de bom mandato. Não usar escala de cor
  "bom/ruim".
- **Fonte:** SRC-01, SRC-04 · **Refs:** REF-05, REF-09

## MET-03 — Funil legislativo
- **Classe:** objetiva
- **Cálculo:** proposições de autoria principal em cada estágio: apresentada → ação em
  comissão → ação fora da comissão → aprovada na Câmara → virou lei (adaptado de REF-05).
- **Referência:** valor esperado dado o cargo e a senioridade (PRI-03). Fase 1: só a
  mediana da Câmara; o ajuste fino fica pendente.
- **Armadilhas:** requerimentos e homenagens inflam a contagem. Filtrar por tipo de
  proposição (PL, PLP, PEC).
- **Exibição no MVP:** o funil do deputado ao lado do funil mediano da Câmara, e a taxa
  "chegou a virar lei / apresentados" com a referência (PRI-02).
- **Armadilhas adicionais (decidir na implementação):**
  - **Tempo:** projeto apresentado ontem ainda não teve chance de avançar. Comparar
    janelas iguais (ex.: projetos com pelo menos N meses) ou mostrar a idade do projeto.
  - **Autoria:** autor principal × coautor. MVP: só autor principal; coautoria aparece
    separada.
  - **Apensação:** projeto apensado a outro "some" do funil, mas o conteúdo pode ter sido
    aprovado. REF-05 dá crédito a texto incorporado; registrar como limitação no MVP.
  - **Mandato novo × veterano:** ainda não há ajuste por senioridade (PRI-03). Avisar na
    tela.
- **Fonte:** SRC-01 (`proposicoes`, `/{id}/autores`, `/{id}/tramitacoes`), SRC-01b
  (`proposicoes-{ano}`, `proposicoesAutores-{ano}`) · **Refs:** REF-05, REF-03

## MET-04 — Votações nominais
- **Classe:** objetiva (o voto) / curada (o agrupamento por tema)
- **Exibição:** lista das votações com o voto do deputado e o resultado. Agrupamento por
  tema só com a curadoria documentada (DEC-05).
- **Armadilhas:** a ementa técnica não é compreensível; um resumo em linguagem simples
  exige revisão (risco de enquadramento, REF-13).
- **Fonte:** SRC-01 · **Refs:** REF-06, REF-07, REF-13

## MET-05 — Financiamento de campanha
- **Classe:** objetiva
- **Exibição:** principais doadores, total por origem (fundo partidário/eleitoral,
  pessoa física, recursos próprios).
- **Armadilhas:** **não** cruzar automaticamente doador × voto com linguagem causal.
- **Fonte:** SRC-02 · **Refs:** REF-13, REF-14

## MET-06 — Processos e condenações
- **Classe:** objetiva, de alto risco jurídico
- **Exibição:** só processos com fonte oficial e o status atual (investigação ≠ réu ≠
  condenado), com data.
- **Fonte:** a definir (`10-pendencias.md`) · **Refs:** REF-01

## Métricas descartadas
- **Projetos apresentados (contagem bruta):** mede volume, não efetividade (PRI-04, REF-03).
- **Número de discursos:** mesmo motivo.
- **Índice geral / nota:** DEC-01.
