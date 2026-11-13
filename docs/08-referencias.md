# 08 — Referências

Status: `verificado-resumo` · `verificado-integral` · `de-memória`.

> **Antes de aplicar qualquer REF:** seguir a regra de uso de referências do `plan.md`
> (ler na íntegra, validar, pesquisar replicações e críticas, atualizar este header).
> Só `verificado-integral` autoriza aplicar.

Ao validar, acrescentar ao header da referência:
- **Validado em:** AAAA-MM-DD · **Para:** DEC/MET/DSG-xx
- **Confirmado / Corrigido:** o que a leitura integral mudou
- **Literatura posterior:** replicações, críticas, contradições

---
## Eixo A — Impacto de expor dados de políticos

## REF-01 — Ferraz & Finan (2008), Exposing Corrupt Politicians
- **Citação:** Ferraz, C.; Finan, F. Exposing Corrupt Politicians: The Effects of Brazil's
  Publicly Released Audits on Electoral Outcomes. *Quarterly Journal of Economics*,
  123(2), 703–745, 2008.
- **Achado:** auditorias da CGU em municípios sorteados e divulgadas antes da eleição de
  2004 reduziram a reeleição de prefeitos, e o efeito cresceu com a corrupção encontrada.
  O efeito foi maior onde havia rádio local.
- **Usado em:** PRI-08, DEC-08, DSG-09
- **Links:** https://econpapers.repec.org/RePEc:oup:qjecon:v:123:y:2008:i:2:p:703-745. ·
  https://www.povertyactionlab.org/evaluation/politicians-publicly-released-audits-corruption-and-electoral-outcomes-brazil?lang=pt-br
- **Status:** verificado-resumo

## REF-02 — NDI/WBI, Global Survey of Parliamentary Monitoring Organizations
- **Citação:** Mandelbaum, A. G. *Strengthening Parliamentary Accountability, Citizen
  Engagement and Access to Information: A Global Survey of PMOs*. NDI / World Bank
  Institute, 2011. `[autoria e ano de memória]`
- **Achado:** levantamento de 191 PMOs em 82 parlamentos.
- **Usado em:** `09-benchmarks.md`
- **Link:** https://www.ndi.org/global-survey-parliamentary-monitoring-organizations
- **Status:** verificado-resumo

## REF-03 — Sites de monitoramento parlamentar na Alemanha, no Reino Unido e na França
- **Citação:** artigo em *Information Polity* (IOS Press), id ip372. `[autores a conferir]`
- **Achado:** os sites parecem melhorar transparência e accountability, mas falta
  evidência sobre o efeito na qualidade do trabalho parlamentar. Contagens simples não
  medem qualidade (o mesmo ponto aparece em material da IDEA).
- **Usado em:** PRI-04, PRI-07
- **Links:** https://content.iospress.com/articles/information-polity/ip372 ·
  https://www.idea.int/sites/default/files/2025-11/parliamentary-monitoring-organizations.pdf
- **Status:** verificado-resumo
- **Tentativa de leitura integral (2026-11-13, para a MET-03):** texto bloqueado (HTTP 403
  na IOS Press). Continua `verificado-resumo`. A regra que ela apoia na MET-03 (não exibir
  contagem bruta como desempenho, PRI-04) fica sustentada pela REF-05, lida na íntegra.
  Achado consistente encontrado na busca: trabalho apresentado na ECPR sobre sites de
  monitoramento argumenta que sites que só contam o uso de instrumentos formais
  (projetos, perguntas) podem gerar incentivos perversos no comportamento dos
  parlamentares (https://ecpr.eu/Events/Event/PaperDetails/54185, só resumo).

## REF-04 — NDI & Directorio Legislativo (2024), evidências de impacto de PMOs
- **Achado:** revisão de evidências com casos na América Latina, África e Ásia.
  Transparência é necessária, mas não suficiente.
- **Usado em:** PRI-07
- **Link:** https://ndi.org/node/27216
- **Status:** verificado-resumo

---
## Eixo B — Métricas e viés de seleção

## REF-05 — Volden & Wiseman, Legislative Effectiveness Scores
- **Citação:** Volden, C.; Wiseman, A. E. *Legislative Effectiveness in the United States
  Congress: The Lawmakers*. Cambridge University Press, 2014. Versão Senado: Volden &
  Wiseman, "Legislative Effectiveness in the United States Senate", *The Journal of
  Politics*, 80(2), 731–735, 2018 (doi:10.1086/697121). Versão estadual: Bucchianeri,
  Volden & Wiseman, *American Political Science Review*, 119(1), 2025.
- **Achado:** efetividade = avanço dos projetos por 5 estágios (apresentado → ação em
  comissão → ação além da comissão → aprovado na casa → lei), com 15 indicadores (5
  estágios × 3 níveis de relevância), comparação com o desempenho esperado e normalização
  para média 1,0. Ignora o alinhamento partidário.
- **Usado em:** PRI-03, PRI-04, DEC-04, MET-03
- **Links:** https://thelawmakers.org/?p=113 ·
  https://thelawmakers.org/wp-content/uploads/2018/12/VoldenWisemanJOP2018.pdf
- **Status:** verificado-integral (artigo JOP 2018, lido em 2026-11-13; o livro de 2014,
  que tem a equação dos pesos, não foi lido).
- **Validação para a MET-03 (2026-11-13):**
  - Confirmado: os 5 estágios ("bill sponsorship, action in committee, action beyond
    committee, passing the House, and becoming law"); "action in committee" = audiências
    e votação na comissão; "action beyond committee" = votação em plenário.
  - Confirmado: os próprios autores adaptam os estágios ao rito da casa (no Senado, a
    Rule XIV permite pular a comissão e eles não dão crédito de "ação em comissão"). Na
    Câmara o equivalente é o **poder conclusivo** das comissões (aprovação sem plenário):
    a MET-03 precisa tratar isso.
  - O LES pondera por relevância e normaliza num índice. **Não usamos o índice** (seria
    uma nota, PRI-01/DEC-01): só o funil descritivo por estágio.
  - Limite declarado pelos autores: o LES "only captures positive lawmaking actions"
    (não vê obstrução, emendas, fiscalização). A tela precisa dizer isso.
  - Desempenho fortemente associado a cargo (maioria, presidência de comissão): base do
    "valor esperado" de PRI-03, ainda pendente.
- **Replicações e críticas encontradas:**
  - REF-28 (Brasil): adaptação do LES à Câmara com um **segundo índice, de relatoria**.
  - REF-29 (crítica): cerca de metade das leis nos EUA passa "de carona" dentro de outro
    projeto; contar só pelo autor subestima a efetividade. No Brasil, o análogo é a
    **apensação**: a MET-03 mostra projetos apensados à parte, não como "parados".

## REF-06 — Seleção de afirmações em Voting Advice Applications
- **Citação:** "A perfect match? The impact of statement selection on voting advice
  applications' ability to match voters and parties", *Electoral Studies*, 2014.
  `[autores a conferir]`
- **Achado:** a escolha das afirmações muda os resultados. Partidos saem prejudicados
  quando entram mais itens sobre temas salientes.
- **Usado em:** PRI-01, PRI-05, DEC-01, DEC-05
- **Link:** https://dare.uva.nl/id/c55af723-1679-47c7-8949-61e8828bf5b2
- **Status:** verificado-resumo

## REF-07 — EUvox vs euandi (2019)
- **Achado:** itens específicos distorcem o posicionamento de algumas famílias
  partidárias. Não existe padrão-ouro de posicionamento.
- **Usado em:** PRI-01, PRI-05
- **Link:** https://research.vu.nl/ws/files/72590928/https_journals.sagepub.com_doi_10.1177_1354068818812209.pdf
- **Status:** verificado-resumo

---
## Eixo C — Uso real por cidadãos

## REF-08 — Escher (2011), TheyWorkForYou research report
- **Citação:** Escher, T. *TheyWorkForYou.com: Analysis of users and usage for UK Citizens
  Online Democracy*. mySociety/UKCOD, maio de 2011, 63 p.
- **Achado (corrigido em 2026-11-13):** 60% dos respondentes nunca tinham procurado **o que
  o representante fazia** (80% já sabiam o nome do seu MP). Dois terços do tráfego vêm de
  buscadores, a maioria pelo **nome de um parlamentar**; perfis e busca por CEP são o
  conteúdo mais acessado. 40% não acharam o que buscavam, mais entre mulheres, idosos,
  sem diploma e pessoas com deficiência.
- **Limites:** pesquisa *intercept* não representativa (n=903), pendendo para homens,
  diplomados, renda alta e 54+. No Reino Unido o CEP leva a um só deputado; no Brasil a
  UF leva a 8–70.
- **Usado em:** PRI-08, DEC-02 (entrada pelo nome primeiro e pelo estado)
- **Links:** https://www.mysociety.org/files/2011/06/TheyWorkForYou_research_report-2011-Tobias-Escher1.pdf
- **Status:** verificado-integral (2026-11-13). Sustenta DEC-02 em parte. Atualização:
  Rumbul, *Who Benefits from Civic Technology?* (mySociety, 2015): civic tech tende a
  ampliar quem já participa. Testar com público de menor escolaridade.

## REF-12 — Chua et al. (AsianCHI '20), From Access to Effective Use
- **Citação:** Chua, U. C.; Santiago, K. L.; Ona, I. B. M.; Peña, R. M. N.; Marasigan,
  G. Z. S.; Delos Reyes, P. G. A.; Samson, B. P. V. "From Access to Effective Use: Open Data
  Portals for Everyday Citizens". *AsianCHI '20* (simpósio no CHI 2020), ACM, p. 61–64.
  doi:10.1145/3391203.3391219. **Não é artigo do main track do CHI**: piloto de 4 páginas.
- **Achado:** survey (n=119) e usabilidade (n=21; 19 analisados), Filipinas. Leigos esperam
  busca "tipo Google" com termos de lugar e tempo; preferem texto com números (45%) e
  tabelas (39%); técnicos preferem o dado bruto. Reclamam de dado incompleto/desatualizado.
- **Usado em:** PRI-07, DEC-02, DEC-07, DSG-10
- **Status:** verificado-integral (2026-11-13). Sustenta DEC-02; DEC-07 em parte (camadas:
  processado primeiro, bruto disponível); **não** sustenta DSG-10 diretamente (base
  complementar: LAI, art. 8º §3º, dados atualizados).

---
## Eixo D — Compreensão de números

## REF-09 — Peters, Västfjäll et al. (2006), Numeracy and Decision Making
- **Citação:** Peters, E.; Västfjäll, D.; Slovic, P.; Mertz, C. K.; Mazzocco, K.; Dickert, S.
  *Psychological Science*, 17(5), 407–413, 2006. doi:10.1111/j.1467-9280.2006.01720.x
- **Achado:** quem tem baixo letramento numérico usa pior os números e sofre mais efeito de
  afeto irrelevante e de enquadramento, independentemente da inteligência geral.
- **Usado em:** PRI-02
- **Status:** verificado-resumo (2026-11-13; texto integral fechado, não acessado).
- **Validação (2026-11-13):** replicação registrada Zhu & Feldman (PCI-RR, 2023, N≈860):
  replica com numeracia contínua; o efeito frequência × percentual **não** replicou na
  análise original. **Não sustenta "preferir frequências"**: Peters, Hart & Fraenkel 2011
  (MDM 31(3)) e Sinayev et al. 2015 (MDM 35(8)) acham percentuais iguais ou melhores para
  compreensão. Por isso DSG-03 foi corrigida (percentual + contagem real). Corrigido o
  link: PMC7159394 é Dieckmann, Slovic & Peters 2009, não este artigo.

## REF-10 — Peters, Dieckmann, Västfjäll et al. (2009), Bringing Meaning to Numbers
- **Citação:** Peters, E.; Dieckmann, N. F.; Västfjäll, D.; Mertz, C. K.; Slovic, P.;
  Hibbard, J. H. *Journal of Experimental Psychology: Applied*, 15(3), 213–227, 2009.
  doi:10.1037/a0016978
- **Achado:** rótulos avaliativos (bom/ruim) num gráfico aumentam o uso dos números por
  quem tem baixo letramento numérico.
- **Usado em:** PRI-02, DSG-03
- **Status:** verificado-resumo (2026-11-13; texto integral fechado, não acessado).
- **Validação (2026-11-13):** sustenta PRI-02 **de forma indireta**: a manipulação é
  justamente bom/ruim, que o projeto não usa (PRI-01). A base para a referência neutra é a
  avaliabilidade (Hsee 1996, OBHDP 67(3); só resumo). Comparar com a média tem efeito
  avaliativo implícito (Fagerlin, Zikmund-Fisher & Ubel 2007, PEC 69). Consequências:
  valor absoluto primeiro, base da comparação nomeada, distribuição inteira em vez de um
  ponto, nada de "acima/abaixo da média" como manchete. Testar com público de baixa
  numeracia.

## REF-11 — Letramento de dados como barreira
- Mesmo estudo de REF-12. Mantido como chave separada para regras de linguagem simples.
- **Usado em:** DSG-07
- **Status:** verificado-integral (2026-11-13), ver REF-12.

---
## Eixo E — Design e retórica visual

## REF-13 — Hullman & Diakopoulos (2011), Visualization Rhetoric
- **Citação:** Hullman, J.; Diakopoulos, N. Visualization Rhetoric: Framing Effects in
  Narrative Visualization. *IEEE TVCG*, 17(12), 2231–2240, 2011. doi:10.1109/TVCG.2011.255
- **Achado:** taxonomia qualitativa de técnicas retóricas (51 visualizações jornalísticas,
  2 codificadores, sem experimento com leitores): omissão, agregação (média/mediana),
  mapeamento (cor, ordem), linguística (negrito, metáfora, falar com o leitor),
  procedimental (visão padrão, comparação fixa).
- **Usado em:** PRI-06, DSG-04, DSG-05, checklist de `06-auditoria.md`
- **Status:** verificado-integral (2026-11-13). Usar como checklist, não como evidência de
  tamanho de efeito. Os autores dizem que "a rhetorical dimension is present in any
  design": PRI-06 foi reescrito como "minimizar e declarar a retórica". Complemento:
  Stokes, Bearfield & Hearst, TVCG 30(10), 2024 (anotações e viés percebido; trechos).

## REF-14 — Kong, Liu & Karahalios (CHI 2018), Frames and Slants in Titles of Visualizations
- **Citação:** Kong, H.-K.; Liu, Z.; Karahalios, K. "Frames and Slants in Titles of
  Visualizations on Controversial Topics". CHI 2018. doi:10.1145/3173574.3174012
- **Achado:** (exp. 2, n=104) o título enviesado conduz a mensagem lembrada (77% seguiram o
  título) e ~80% ainda julgam a informação neutra. Título "aberto" (tema + período) foi o
  mais neutro; citar só uma variável já é viés sutil.
- **Usado em:** PRI-06, DEC-06, DSG-05
- **Status:** verificado-integral (2026-11-13). Sustenta títulos descritivos com período.
  Limites: 2 gráficos, EUA, tema polêmico. Posterior: Kong et al. CHI 2019 (título vence o
  gráfico quando se contradizem; só resumo). Em teste com usuários, perguntar "qual a
  mensagem principal?", não "parece neutro?".

## REF-15 — Holder & Bearfield (2024), Polarizing Political Polls
- **Citação:** Holder, E.; Bearfield, C. X. "Polarizing Political Polls: How Visualization
  Design Choices Can Shape Public Opinion and Increase Political Polarization". *IEEE
  TVCG*, 30(1), 1446–1456, 2024 (VIS 2023). doi:10.1109/TVCG.2023.3326512
- **Achado:** 3 experimentos MTurk (n=927/1212/750), opiniões simuladas, EUA: o gráfico por
  partido ampliou a distância entre partidos (+8,1 pontos); a referência nacional também
  induz conformidade, sem polarizar.
- **Usado em:** PRI-06, DEC-03, DSG-06
- **Status:** verificado-integral (2026-11-13). Sustenta **em parte e de forma indireta**
  "partido nunca é o agrupamento padrão": o estudo é sobre opinião, sistema bipartidário,
  não sobre desempenho de parlamentares. Não sustenta veto total à visão por partido.
  Consequências: sem cor de partido; partido só como informação/filtro opcional; a
  referência da Câmara também é norma implícita (não dizer o que é "esperado").

## REF-16 — Shneiderman (1996), The Eyes Have It
- **Citação:** Shneiderman, B. The Eyes Have It: A Task by Data Type Taxonomy for
  Information Visualizations. *Proc. IEEE Symposium on Visual Languages*, 336–343, 1996.
  doi:10.1109/VL.1996.545307
- **Achado:** "overview first, zoom and filter, then details-on-demand", que o próprio
  autor chama de "only a starting point". Ensaio de posição, sem teste do mantra.
- **Usado em:** DSG-01
- **Status:** verificado-integral (2026-11-13, versão TR CS-TR-3665). Crítica: Craft &
  Cairns, IV 2005 ("no reasonably obvious studies that have validated" o mantra). Usar
  como princípio de navegação, não como evidência; validar com teste de usabilidade.

## REF-17 — Cleveland & McGill (1984), Graphical Perception
- **Citação:** Cleveland, W. S.; McGill, R. Graphical Perception: Theory, Experimentation,
  and Application to the Development of Graphical Methods. *JASA*, 79(387), 531–554, 1984.
  doi:10.1080/01621459.1984.10478080
- **Achado:** hierarquia de precisão: posição numa escala comum > comprimento > ângulo >
  área > volume/cor.
- **Usado em:** DSG-02
- **Status:** verificado-resumo (2026-11-13; texto integral não obtido). Replicação lida na
  íntegra: Heer & Bostock, CHI 2010 (doi:10.1145/1753326.1753357, N=50 por gráfico):
  "position encoding still significantly outperformed length"; ordem geral preservada.
  Pendente: leitura integral do original.

## REF-18 — W3C, WCAG 2.2
- **Citação:** Web Content Accessibility Guidelines 2.2, W3C Recommendation de 05/10/2023,
  atualizada em 12/12/2024; também ISO/IEC 40500:2025. Referência nacional: **ABNT NBR
  17225:2025** (feita a partir da WCAG 2.2, gratuita).
- **Link:** https://www.w3.org/TR/WCAG22/
- **Usado em:** DSG-08
- **Status:** verificado-resumo (2026-11-13: status e critérios usados conferidos; texto
  inteiro não lido). Critérios aplicados: 1.1.1, 1.3.1, 1.4.1, 1.4.3, 1.4.10, 1.4.11,
  2.4.7, 2.5.8 (alvos de 44 px), 3.1.1, 4.1.3.

## REF-19 — Okabe & Ito, Color Universal Design
- **Citação:** Okabe, M.; Ito, K. *Color Universal Design (CUD): How to make figures and
  presentations that are friendly to colorblind people*. J*FLY, 2002 (rev. 2008).
  https://jfly.uni-koeln.de/color/
- **Achado:** recomendação prática (sem experimento): cor nunca como canal único, rótulo
  direto, contraste de brilho. Os hex da paleta vêm de Wong, *Nature Methods* 8:441, 2011.
- **Usado em:** DSG-04
- **Status:** verificado-integral (2026-11-13). Contraste sobre branco: #0072B2 = 5,19:1
  (deputado); #999999 = 2,85:1 reprova 1.4.11, por isso a referência usa cinza mais
  escuro.

## REF-21 — GOV.UK Design System
- **Link:** https://design-system.service.gov.uk (GDS; OGL v3)
- **Uso:** padrões testados com usuários (critério "Usable": componente publicado só depois
  de pesquisa com amostra representativa, inclusive pessoas com deficiência). Usados:
  details para explicação opcional, tabela, skip link. Não tem busca nem visualização de
  dados. Identidade própria (o Service Manual proíbe coroa, logo e fonte GOV.UK).
- **Status:** verificado-resumo (2026-11-13; páginas consultadas, não o site inteiro).

## REF-22 — U.S. Web Design System (USWDS)
- **Link:** https://designsystem.digital.gov (GSA, v3.14.0)
- **Uso:** página "Data visualizations": tabela equivalente a cada gráfico, resumo em texto,
  não depender de hover nem de cor, eixo começando em zero. Não cita pesquisa.
- **Status:** verificado-resumo (2026-11-13).

---
## Eixo F — Segurança em desenvolvimento com IA ("vibe coding")

Indicadas pelo usuário em 2026-11-13. Uso pretendido: `13-seguranca.md`,
`14-barreiras-ci.md`.

## REF-23 — Understanding the (In)Security of Vibe-Coded Applications (arXiv, 2026)
- **Citação:** arXiv:2606.23130 (cs.CR, cs.SE), jun/2026, revisado depois. `[autores a conferir]`
- **Achado (resumo):** auditoria de aplicações reais geradas por agentes (incluindo Claude
  Code), com framework de auditoria assistida por agente + validação humana. Padrões
  recorrentes: lógica placeholder, entrada sem filtro, exposição de segredos. Causas
  atribuídas: perda de memória do agente, objetivos locais e conhecimento fraco de
  segurança. Mitigação mais eficaz entre as testadas: prompt "pronto para produção" +
  harness de agente endurecido.
- **Atenção:** os números variam entre versões do paper (90–91% dos apps vulneráveis,
  1.186 a 1.471 vulnerabilidades, Broken Access Control como classe principal em uma
  versão). Usar a versão mais recente do arXiv.
- **Usado em:** SEG-04, SEG-06, barreira 2
- **Link:** https://arxiv.org/pdf/2606.23130
- **Status:** verificado-resumo

## REF-24 — CSA, Secure Vibe Coding Guide (2025)
- **Citação:** Huang, K. *Secure Vibe Coding Guide*. Cloud Security Alliance, 09/04/2025.
  Seguimento: framework R.A.I.L.G.U.A.R.D (regras para agentes). Nota de pesquisa de
  2026: "The Vibe Coding Governance Gap".
- **Achado (resumo):** código gerado por IA não é seguro por padrão. Checklist baseado no
  OWASP Secure Coding Practices Quick Reference.
- **Usado em:** SEG-07 (checklist de PR), barreira 2
- **Links:** https://cloudsecurityalliance.org/blog/2025/04/09/secure-vibe-coding-guide ·
  https://labs.cloudsecurityalliance.org/wp-content/uploads/2026/06/CSA_research_note_vibe_coding_ai_governance_gap_20260602-csa-styled.pdf
- **Status:** verificado-resumo

## REF-25 — IBM Think, Vibe coding security risks
- **Achado (resumo):** o risco mudou de natureza: vem do ecossistema (dependências,
  credenciais) e da delegação de decisões ao modelo, mais do que da sintaxe. Credenciais
  vazadas em projetos vibe-coded são corrigidas com menos frequência. O volume de commits
  dificulta a revisão. Cita *slopsquatting*.
- **Usado em:** barreira 1, barreira 2, DEC-13
- **Link:** https://www.ibm.com/think/insights/vibe-coding-security-risks
- **Status:** verificado-resumo (snippets truncados)

## REF-26 — Databricks AI Red Team, Passing the Security Vibe Check (2025)
- **Citação:** Archibald, N.; Kaplan, C. *Passing the Security Vibe Check: The Dangers of
  Vibe Coding*. Databricks Blog, 12/08/2025.
- **Achado (resumo):** casos reais de falhas críticas (execução arbitrária de código,
  corrupção de memória) em código que parecia funcional. Práticas de prompt reduzem o
  risco (uma fonte secundária fala em cerca de 50% com prompts de autorreflexão; não
  confirmado na fonte).
- **Usado em:** SEG-07
- **Link:** https://www.databricks.com/blog/passing-security-vibe-check-dangers-vibe-coding
- **Status:** verificado-resumo

## REF-27 — "A Systematic Analysis of AI-Assisted Vibe Coding in Software Development"
- **Status:** **não localizado** (busca em 2026-11-13 não encontrou o título no
  ResearchGate). Pedir o link ao usuário. Alternativas revisadas por pares/sistemáticas
  encontradas:
  - Multivocal literature review: arXiv:2607.21652 (Siddeeq, Waseem, Kemell, Saari, Rasku,
    Abrahamsson)
  - State-of-the-art review (prática, desempenho, produtividade, risco): arXiv:2608.20446
  - Grey literature review (Blincoe et al.): arXiv:2510.00328

## REF-20 — Linguagem simples no setor público brasileiro
- **Citação:** Lei nº 15.263, de 14/11/2025 (Política Nacional de Linguagem Simples), DOU de
  17/11/2025. Complementar: Lei de Acesso à Informação, Lei nº 12.527/2011 (art. 5º;
  art. 8º, §3º).
- **Achado:** técnicas do art. 5º: ordem direta, frases curtas, palavras comuns, nome antes
  da sigla, listas e tabelas com o mais importante primeiro, voz ativa, testar com o
  público-alvo (XVIII).
- **Usado em:** DSG-07, PRI-07
- **Status:** verificado-integral (2026-11-13). Obriga só a administração pública; adotada
  aqui como padrão de redação. A LAI apoia a data de coleta visível e o dado atualizado.

## REF-28 — Rey (2021), efetividade legislativa na Câmara dos Deputados
- **Citação:** Rey, B. Tese de doutorado, Syracuse University, 2021
  (https://surface.syr.edu/etd/1531). Resumo do Center for Effective Lawmaking:
  https://thelawmakers.org/legislative-research/is-legislative-effectiveness-a-global-concern-new-research-from-brazil
- **Achado:** adapta o LES à Câmara (2011–2018) com dois índices: autoria (projetos que
  passaram pela Mesa, ganharam relator, tiveram parecer e viraram lei) e **relatoria**
  (fração das relatorias do deputado que viraram lei). Só ~0,5% dos projetos de deputados
  são aprovados na mesma sessão legislativa.
- **Usado em:** MET-03 (validação da REF-05; relatoria fica como pendência)
- **Status:** verificado-resumo (resumo do CEL; tese não lida). Ler a tese antes de
  implementar a relatoria.

## REF-29 — Casas, Denny & Wilkerson (2020), "More Effective Than We Thought"
- **Citação:** Casas, A.; Denny, M. J.; Wilkerson, J. "More Effective Than We Thought:
  Accounting for Legislative Hitchhikers Reveals a More Inclusive and Productive
  Lawmaking Process". *American Journal of Political Science*, 64(1), 5–18, 2020.
  doi:10.1111/ajps.12472
- **Achado:** projetos que viram lei como dispositivos de outros projetos ("hitchhikers")
  são cerca de metade das leis; contando-os, o processo legislativo parece mais produtivo,
  menos hierárquico e menos partidário do que o LES por autoria indica.
- **Usado em:** MET-03 (crítica à REF-05: apensação mostrada à parte)
- **Status:** verificado-resumo (resumo e post dos autores no Legislative Branch blog).

