# 05 — Design e visualização

## Base do design

Duas camadas, ambas com fundamento:
1. **Visualização de dados e números** — DSG-01..10 abaixo, cada regra com REF.
2. **Sistema de design (componentes, tipografia, formulários, navegação):** partir de
   um design system público **construído com pesquisa com usuários** e documentado.
   Candidatos (escolher e validar no momento de uso; regra do `plan.md`):
   - **GOV.UK Design System:** padrões publicados com a pesquisa que os justifica.
     Foco em acessibilidade e linguagem simples. REF-21 `[de-memória]`
   - **U.S. Web Design System (USWDS):** componentes com orientação de acessibilidade e
     pesquisa de uso. REF-22 `[de-memória]`
   - **Padrão Digital de Governo (gov.br DS):** público brasileiro já familiarizado.
     **Cuidado:** usar a identidade visual do gov.br faria o portal parecer oficial. Usar
     só como referência de padrão, nunca o visual.
   - Usar a **metodologia** e os padrões validados, com identidade visual própria.

## DSG-01 — Arquitetura: visão geral → zoom/filtro → detalhe sob demanda
- Home: busca por CEP/nome. Perfil: cards resumidos. Card → detalhe → dado bruto.
- **Ref:** REF-16 (o "mantra" de Shneiderman)

## DSG-02 — Codificação visual: posição e comprimento antes de área e cor
- Usar barras e pontos numa escala comum. Evitar pizza, bolhas e mapas de calor para
  comparação de valores.
- **Ref:** REF-17

## DSG-03 — Todo gráfico mostra a referência
- Linha ou faixa da média/mediana (UF ou Câmara) no próprio gráfico, mais uma frase em
  texto simples ("acima de 7 em cada 10 deputados do RS").
- Preferir frequências naturais ("7 em cada 10") a percentuais isolados.
- **Ref:** REF-09, REF-10

## DSG-04 — Cor neutra, nunca semáforo de valor
- Sem verde = bom / vermelho = ruim nas métricas (isso seria julgar, PRI-01).
- Usar um tom neutro para o deputado e cinza para a referência. Paleta segura para
  daltônicos.
- **Ref:** REF-13, REF-19

## DSG-05 — Títulos e rótulos descritivos
- Título diz **o que** o gráfico mostra, com período. Nenhum verbo avaliativo.
- Revisão de texto com checklist anti-enquadramento (`06-auditoria.md`).
- **Ref:** REF-14, REF-13

## DSG-06 — Partido nunca é o agrupamento padrão
- **Ref:** REF-15 (DEC-03)

## DSG-07 — Linguagem simples
- Frases curtas, voz ativa, sem siglas sem explicação (CEAP → "cota para despesas do
  mandato"). Glossário acessível em cada termo técnico.
- **Ref:** REF-11, REF-20 `[verificar]`

## DSG-08 — Mobile primeiro e acessível
- WCAG 2.2 nível AA: contraste, navegação por teclado, texto alternativo e tabela
  equivalente para todo gráfico (que também serve de dado bruto acessível).
- **Ref:** REF-18

## DSG-09 — Card compartilhável
- Imagem com: métrica, período, referência, fonte e link curto para a página de
  auditoria. Sem título opinativo.
- **Ref:** REF-01, REF-08

## DSG-10 — Incerteza e lacunas visíveis
- Dado faltando aparece como "sem dado na fonte", nunca como zero. Data da última coleta
  sempre visível.
- **Ref:** REF-12 `[sem-ref específica para incerteza; buscar Hullman sobre uncertainty vis]`
