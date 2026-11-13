# 04 — Métricas

Cada métrica: o que mede · cálculo · comparação de referência · armadilhas · fonte · refs.
Classe: **objetiva** (fato verificável) ou **curada** (depende de seleção humana, PRI-05).

## MET-01 — Presença em sessões deliberativas
- **Classe:** objetiva
- **Cálculo:** presenças ÷ sessões deliberativas no período. Ausências justificadas são
  exibidas à parte, não somadas.
- **Referência:** mediana da Câmara e faixa interquartil (PRI-02).
- **Armadilhas:** obstrução e licenças (saúde, cargo no Executivo). Mostrar o motivo.
- **Fonte:** SRC-01d (frequência), SRC-01b (dias de sessão), SRC-01 · **Refs:** REF-09, REF-10
- **Implementação (`met01-v1`, 2026-11-13):**
  - **Unidade:** o *dia* com sessão deliberativa em Plenário, como a Câmara registra a
    frequência oficial (`descricaoFrequenciaDia`). Dia com duas sessões conta uma vez.
  - **Período:** legislatura atual (desde 01/02/2023) até o último dia coletado.
  - **Denominador:** só os dias em que o deputado estava em exercício (o próprio
    webservice só o lista nesses dias).
  - **Ausência justificada** conta como ausência na taxa e é exibida à parte, com o
    motivo (licença de saúde, missão autorizada…).
  - **Referência:** mediana e P25–P75 (quantil tipo 7, o padrão do R/NumPy) dos deputados
    em exercício com **pelo menos 30 dias** de sessão no período. Quem tem menos aparece
    com o próprio número e um aviso de período curto, mas fica fora da referência.
  - **Sessões conjuntas do Congresso não entram.** O webservice por dia não as lista, e
    o Ato da Mesa 191/2017 conta as sessões deliberativas da própria Câmara. A página
    "Presença em Plenário" do site da Câmara inclui as conjuntas no total de dias, então
    os nossos totais podem ser um pouco menores. A tela avisa isso.
  - **Conferência independente (2026-11-13)** contra a página oficial de um deputado
    (2025): Câmara 121 dias (105 P, 7 AJ, 9 A); nosso 116 (101 P, 6 AJ, 9 A). A diferença
    são exatamente 5 sessões conjuntas (4 presenças, 1 missão autorizada); os demais dias
    batem um a um.
  - Recoleta dos últimos 60 dias a cada execução: justificativa pode ser lançada depois.
  - **"Presença (~)"** (visto em ~1% dos dias): o dia aparece como presença, mas a sessão
    registra ausência. O símbolo não tem legenda oficial publicada. O Ato da Mesa 191/2017
    (art. 2º, parágrafo único) diz que a consolidação administrativa da presença do dia não
    se sobrepõe à ausência registrada na ata da sessão. Por isso: categoria própria,
    exibida à parte com essa explicação e **fora** da taxa de presença. Pendente: confirmar
    o significado com a Câmara (pedido via LAI).

## MET-02 — Uso da cota parlamentar (CEAP)
- **Classe:** objetiva
- **Cálculo:** gasto no período ÷ teto da UF. Detalhar por categoria e por fornecedor.
- **Referência:** média dos deputados da **mesma UF** (o teto varia por UF; PRI-03).
- **Sinais auditáveis (sem acusar):** concentração em poucos fornecedores, fornecedor com
  CNPJ aberto pouco antes do primeiro pagamento. Exibir como dado, sem rótulo de
  irregularidade.
- **Armadilhas:** gastar pouco não é sinônimo de bom mandato. Não usar escala de cor
  "bom/ruim".
- **Fonte:** SRC-01c (despesas), SRC-01 (histórico do mandato), SRC-04 (fora do MVP) ·
  **Refs:** REF-05, REF-09
- **Implementação (`met02-v1`, 2026-11-13):**
  - **Período:** os 12 meses fechados mais recentes cujo prazo de 90 dias para apresentar
    a nota já acabou (antes disso o mês está incompleto; Câmara, "Guia para jornalistas").
  - **Gasto:** soma do `vlrLiquido` (o que saiu da cota, já descontada a glosa) dos meses
    em que o deputado esteve em exercício (histórico do mandato, SRC-01).
  - **Valor-base, não "teto":** soma do valor mensal do Anexo do Ato da Mesa 43/2009 para
    a UF em cada mês em exercício. Vale a tabela vigente no 1º dia do mês: Ato 270/2023
    até fev/2026 e Ato 244/2026 (em vigor desde 20/02/2026) a partir de mar/2026. O valor-base
    **não** inclui: adicionais por cargo (art. 1º §1º: R$ 902,02 a R$ 5.075,62/mês),
    adicional por missão no Parlasul (§3º) nem o saldo acumulado no ano (art. 13). E o
    que passar do saldo anual é **descontado do salário** do deputado (art. 13 §2º). Por
    isso o percentual pode passar de 100% sem que isso seja, por si, irregular: a tela diz
    isso e não usa a palavra "teto" (PRI-01). Em nov/2026, 24 de 513 passaram de 100%.
  - **Referência:** média dos deputados da mesma UF (PRI-03), com mediana e P25–P75, só
    de quem esteve pelo menos 6 meses em exercício no período.
  - **Detalhe:** gasto por categoria; 10 maiores fornecedores (CNPJ e nome); parcela dos
    3 maiores. Fornecedor pessoa física aparece só como "Pessoa física", sem nome nem CPF
    (LGPD); o CPF do deputado e o nome de passageiros não saem do arquivo bruto.
  - Conferência independente (2026-11-13): um deputado recalculado em Python direto do
    CSV oficial deu exatamente o mesmo gasto, valor-base e percentual.

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
- **Fonte:** SRC-01b (`proposicoes-{ano}`, `proposicoesAutores-{ano}`,
  `proposicoesTramitacoes-{ano}`) · **Refs:** REF-05 (verificado-integral), REF-28,
  REF-29, REF-03
- **Implementação (`met03-v1`, 2026-11-13):**
  - **Projetos:** PL, PLP e PEC com o deputado como autor principal (ordem de assinatura
    1), apresentados desde 01/02/2023. Coautoria não entra (pendência).
  - **Estágios ("chegou pelo menos até"):** 1 apresentado; 2 parecer de relator em
    comissão; 3 passou das comissões (ação em Plenário: votação, discussão, urgência,
    parecer de Plenário); 4 aprovado na Câmara (remessa ao Senado/sanção/promulgação,
    redação final aprovada, ou situação atual de quem já foi aprovado); 5 virou lei.
    Estágio mais avançado implica os anteriores: aprovação **conclusiva** nas comissões
    (sem Plenário) conta como "passou das comissões", como os autores da REF-05 adaptam
    os estágios ao rito de cada casa. Aprovação de PEC em Plenário só conta como aprovada
    com a remessa (1º turno não basta). Vocabulário das tramitações em
    `packages/metrics/src/index.ts`.
  - **À parte, nunca como "parados":** apensados (tramitando em conjunto; o conteúdo pode
    seguir no projeto principal, REF-29), arquivados, retirados pelo autor e devolvidos.
    Não dá para saber de forma estruturada se o principal de um apensado virou lei (o
    vínculo some com a desapensação): fica como pendência, sem número na tela.
  - **Sem índice nem pesos** (PRI-01): o LES da REF-05 pondera e normaliza; aqui só o
    funil descritivo.
  - **Referência:** mediana e P25–P75 da Câmara em cada estágio (todos os deputados em
    exercício) e da taxa "virou lei ÷ apresentados" (quem apresentou ≥ 5). Em nov/2026 a
    mediana da taxa é 0%: a maioria não teve projeto próprio transformado em lei na
    legislatura (97 de 513 tiveram ao menos um). A tela mostra essa distribuição em vez
    de só a mediana.
  - **Conferência independente (2026-11-13):** as 17 leis do deputado com mais leis
    conferem uma a uma com a situação na API v2.
  - Limitação a declarar na tela (REF-05): o funil só vê o avanço dos próprios projetos;
    relatoria (REF-28), emendas, fiscalização e obstrução ficam de fora.

### Lista de projetos para o cidadão (2026-11-13)
Sem IA e sem texto mantido à mão: só regras sobre o que a Câmara publica (SRC-01b).
- **Do que trata** (nesta ordem): ementa detalhada da Câmara (6,3% dos projetos) → o objetivo,
  quando a ementa começa por "Altera/Acrescenta/Dá nova redação…": o trecho depois de "para"
  ou "a fim de" **seguido de verbo no infinitivo** (40,1%, exibido como "Objetivo: …"; o
  infinitivo evita pegar o "para" do nome da lei citada) → a ementa, quando já começa por
  verbo direto ("Institui", "Proíbe"…; 45,6%) → palavras-chave da Câmara (8%). O cartão sempre diz a
  origem do texto e mostra a ementa oficial a um clique (`apps/web/lib/projetos.ts`).
- **Tema:** classificação oficial da Câmara (`proposicoesTemas-{ano}`, 31 temas; 99,8% dos
  projetos). Gráfico "Sobre quais temas apresenta projetos?": parte de cada tema nos projetos
  do deputado, com a parte do tema em todos os projetos da Câmara como referência (PRI-02).
- **Situação em linguagem simples:** mapa fixo das ~35 situações da Câmara; situação nova
  aparece como a Câmara escreve. Mais a régua de etapas do funil e "quem decide"
  (comissões, de forma conclusiva, ou Plenário).
- **Lista** (não cartões): linha com número, data, "do que trata" em até 2 linhas, etiquetas
  de tema, situação simples e mini-régua de etapas. Filtros: texto, tema, etapa, situação (em
  andamento, anexado, virou lei, arquivado/retirado/devolvido). Ordenação: mais recentes, mais
  antigos, mais avançados, número. Carregada quando a seção aparece na tela.
- **Detalhes num painel lateral** (`<dialog>` nativo: foco preso, Esc, fundo): resumo e
  origem, temas, situação e régua, quem decide e regime, ementa oficial, palavras-chave,
  situação como a Câmara escreve e link para a Câmara (nova aba). Link próprio
  (`#projeto-ID`) para compartilhar; tela cheia no celular.

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
