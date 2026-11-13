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
- **Exceção (2026-11-13, decisão do usuário):** "ausência sem justificativa" no gráfico mensal
  de presença usa vermelho sóbrio `#C2410C` (contraste 5:1). Só essa categoria; presença
  continua azul e ausência justificada, cinza. Registrado porque contraria a regra geral
  (vermelho = "ruim"); reavaliar no teste com usuários (o que a pessoa entende ao ver o
  vermelho).
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

## Navegação, mapa e layout responsivo (2026-11-13)
Pesquisa de referências registrada em `08-referencias.md` (REF-30 a REF-33). Aplicado:
- **Home, nesta ordem:** 1º busca pelo nome, em destaque no topo da página (o que a maioria
  procura; REF-08, REF-33); 2º "Ou escolha pelo estado": campo de busca de estado **acima do
  mapa**, mapa e lista sincronizados (digitar realça no mapa e na lista; Enter abre).
- **Busca do cabeçalho = navegação da aplicação** (paleta de comandos, atalho `/` ou
  Ctrl+K): leva a páginas e seções (método de cada métrica, fontes, reportar erro) e, como
  atalho, a deputados e estados. Padrão combobox do WAI-ARIA APG (REF-30), sugestões
  agrupadas e em uma linha.
- **Mapa do Brasil como atalho, nunca como única via** (REF-31): lista ao lado (teclado,
  2.1.1; exceção "equivalente" do 2.5.8). Cor única neutra, sem codificar dado (DSG-04);
  realce no hover **e** no foco; estados pequenos com rótulo externo tocável; DF com área de
  toque ampliada. Malha: IBGE.
- **Sistema visual: DEC-14** (Tailwind CSS v4 + padrões e tokens do shadcn/ui). Cor da
  marca (índigo) só na interface, nunca nos dados; cartões com cabeçalho (ícone + título +
  período); perfil com foto redonda e badges; contêiner `max-w-6xl`, métricas em 2 colunas a
  partir de `lg`. Só títulos com `clamp()` somando rem (1.4.4). Cabeçalho fixo com
  `scroll-padding-top` (2.4.11).
- Exemplos de busca não citam parlamentares reais (escolher quem aparece não é neutro).
- Pendente: modo escuro, busca sem JavaScript, e teste com usuários de celular (mapa real ×
  cartograma em grade).

## Gráficos interativos (2026-11-13)
Os gráficos são o destaque da página do deputado. Cada métrica abre com o número-chave ao
lado do gráfico de **posição** ("onde está entre os demais"), precedido da frase de valor
("Presença maior que a de 53 dos 512 deputados"); o gráfico confirma, não precisa ser
decifrado. Abaixo, a série mês a mês.
- **Posição** (`componentes/graficos/Posicao.tsx`): um traço por deputado (pontos em grupos
  pequenos), o deputado como ponto grande e rotulado, mediana em traço escuro, metade do
  meio em faixa suave; escala começando em zero (DSG-02). Substituiu o histograma: diz o
  mesmo de forma mais direta.
- **Série mensal** (presença: presente / ausência justificada / sem justificativa; cota:
  gasto × valor-base em linha tracejada) e **barras horizontais** (categorias; funil com a
  mediana da Câmara como marcador na mesma escala).
- **Interação** (padrão OWID/NYT/FT): mouse mostra a dica; toque seleciona e a dica fica no
  alto do gráfico, nunca sob o dedo; teclado percorre com setas/Home/End; leitura anunciada
  e tabela equivalente para leitor de tela. Nada depende só do hover (1.4.13, 2.1.1). Ao
  percorrer os deputados, a dica mostra o valor e quantos ficam abaixo, **sem nomes** (DEC-01).
- **Responsivo de verdade:** o SVG é desenhado na largura medida do contêiner
  (ResizeObserver), então o texto tem o mesmo tamanho em qualquer tela; a dica mede a
  própria largura e nunca é cortada. Verificado em 360 px sem rolagem horizontal.
- **Cores:** gráficos neutros (deputado `#0072B2`, cinzas); as cores da bandeira ficam só na
  interface (DEC-14), nunca nos dados.
- **Navegação entre deputados pelo gráfico:** clicar (ou Enter) num deputado do gráfico de
  posição abre a página dele já no **mesmo gráfico** (`#posicao-presenca`/`#posicao-cota`),
  com destaque temporário (sem animação se "reduzir movimento"). Botão **Voltar** no topo das
  páginas internas: volta no histórico se a pessoa navegou no portal; senão vai ao destino.
- **Frase de posição considera empates:** "Nenhum deputado tem presença maior: outros 15
  também têm 100%", nunca "maior que a de 490" para quem está empatado no topo (teste em
  `apps/web/lib/formato.test.ts`).

