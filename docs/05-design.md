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
- Valor absoluto primeiro; logo depois a comparação, com a base nomeada (Câmara inteira
  ou mesmo estado) e o período.
- O gráfico mostra a **distribuição inteira** (um traço por deputado) mais a mediana, não
  só um ponto de referência: uma média isolada vira norma implícita.
- Formato: **percentual** e **contagem real** para a posição ("presença maior que a de 53
  dos 512 deputados"). ~~Frequências naturais ("7 em cada 10")~~ — retirado em 2026-11-13:
  "7 em cada 10" não é frequência natural, e para proporções simples a evidência favorece
  o percentual (ver REF-09).
- Nada de "acima/abaixo da média" como manchete; nada de sigla "P25–P75" na tela ("metade
  dos deputados ficou entre X e Y").
- **Ref:** REF-09, REF-10 (indiretas; ver validação em `08-referencias.md`)

## DSG-04 — Cor neutra, nunca semáforo de valor
- Sem verde = bom / vermelho = ruim nas métricas (isso seria julgar, PRI-01). Sem cor de
  partido.
- Deputado: ponto cheio azul `#0072B2` (5,19:1). Referência: traço cinza `#595959`;
  distribuição em cinza `#85857F` (≥ 3:1, WCAG 1.4.11). Forma diferente além da cor.
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
- **Ref:** REF-11, REF-20 (Lei 15.263/2025)

## DSG-08 — Mobile primeiro e acessível
- WCAG 2.2 nível AA: contraste, navegação por teclado, texto alternativo e tabela
  equivalente para todo gráfico (que também serve de dado bruto acessível).
- **Ref:** REF-18

## DSG-09 — Card compartilhável
- Imagem com: métrica, período, referência, fonte e link curto para a página de
  auditoria. Sem título opinativo.
- **Ref:** REF-01, REF-08

## DSG-10 — Incerteza e lacunas visíveis
- Dado faltando aparece como "sem dado", nunca como zero. Período e data da última coleta
  sempre visíveis, no mesmo rodapé padrão em toda métrica.
- **Ref:** REF-12 (indireta), LAI art. 8º §3º (REF-20) `[sem-ref específica para
  incerteza; buscar Hullman/Padilla sobre uncertainty vis quando houver intervalo]`

## Implementação (2026-11-13)
Pareceres de validação das REF desta página registrados em `08-referencias.md`. Regras
práticas aplicadas em `apps/web`:
- Título = métrica + recorte + período, sem verbo, adjetivo, pergunta ou "você" (REF-14).
- Rodapé de proveniência idêntico em todas as métricas (REF-13: credibilidade seletiva
  também é retórica).
- Funil como barras alinhadas à esquerda numa tabela, não funil centralizado (REF-17).
- Todo gráfico com tabela equivalente; alvos de toque de 44 px; contraste AA (REF-18).
- Pendente: teste de compreensão com 5–8 pessoas de baixa escolaridade, no celular,
  perguntando "qual a mensagem principal?" (REF-14, REF-20 art. 5º XVIII).
