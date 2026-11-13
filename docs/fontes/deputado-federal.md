# Fontes — Deputado federal

Levantado em 2026-11-13. Cada SRC: o que cobre · acesso · documentação · uso (MET) ·
limitações · status da verificação.

Status: `verificado-doc` (documentação oficial lida) · `verificado-terceiros` (só por
fontes secundárias) · `a-verificar`.

## Mapa: o que queremos saber → fonte

| Dimensão do deputado | Fonte principal | Complementar |
|---|---|---|
| Identidade, partido, UF, situação, histórico | SRC-01 | SRC-02 |
| Presença em sessões e comissões | SRC-01d (frequência oficial em Plenário, com justificativa) | SRC-01b (`eventos`, `eventosPresencaDeputados`) |
| Votações nominais e orientação de bancada | SRC-01 (`votacoes`), SRC-01b | — |
| Proposições e tramitação (funil MET-03) | SRC-01 (`proposicoes`), SRC-01b | — |
| Comissões, cargos, liderança, Mesa | SRC-01 (`orgaos`, `legislaturas`) | — |
| Frentes parlamentares | SRC-01 (`frentes`) | — |
| Discursos | SRC-01 (`deputados/{id}/discursos`) | — |
| Cota parlamentar (CEAP) | SRC-01c | SRC-01 (`despesas`) |
| Fornecedores da CEAP (abertura, sócios) | SRC-04 | SRC-05 |
| Gabinete (secretários parlamentares) | SRC-01b (`funcionarios`) | — |
| Emendas parlamentares | SRC-03 (`emendas`) | SRC-09, SRC-10 |
| Candidatura, bens declarados, doadores, gastos de campanha | SRC-02 | SRC-02b |
| Sanções (empresas ligadas) | SRC-03 (CEIS, CNEP, CEAF, CEPIM) | — |
| Processos — STF (foro) | SRC-07 | — |
| Processos — demais tribunais (metadados) | SRC-06 | — |
| Contas julgadas irregulares | SRC-08 | — |

---

## SRC-01
### Câmara dos Deputados — API Dados Abertos v2
- **Base:** `https://dadosabertos.camara.leg.br/api/v2`
- **Docs:** https://dadosabertos.camara.leg.br/swagger/api.html · spec OpenAPI:
  `https://dadosabertos.camara.leg.br/api/v2/api-docs` · repositório:
  https://github.com/CamaraDosDeputados/dados-abertos
- **Formato:** JSON e XML. **Auth:** nenhuma.
- **Paginação:** `pagina` (padrão 1) e `itens` (padrão 15, **máximo 100**).
- **Endpoints relevantes (lidos da spec):**
  - Deputados: `/deputados`, `/deputados/{id}`, `/{id}/despesas`, `/{id}/discursos`,
    `/{id}/eventos`, `/{id}/frentes`, `/{id}/historico`, `/{id}/mandatosExternos`,
    `/{id}/ocupacoes`, `/{id}/orgaos`, `/{id}/profissoes`
  - Eventos: `/eventos`, `/eventos/{id}`, `/{id}/deputados`, `/{id}/orgaos`,
    `/{id}/pauta`, `/{id}/votacoes`
  - Votações: `/votacoes`, `/votacoes/{id}`, `/{id}/orientacoes`, `/{id}/votos`
  - Proposições: `/proposicoes`, `/{id}`, `/{id}/autores`, `/{id}/relacionadas`,
    `/{id}/temas`, `/{id}/tramitacoes`, `/{id}/votacoes`
  - Órgãos: `/orgaos`, `/{id}`, `/{id}/eventos`, `/{id}/membros`, `/{id}/votacoes`
  - Legislaturas: `/legislaturas`, `/{id}`, `/{id}/lideres`, `/{id}/mesa`
  - Partidos, Blocos, Frentes, Grupos e `/referencias/*` (tabelas de códigos)
- **Uso:** MET-01, MET-03, MET-04 e identidade.
- **Limitações:** só votações **nominais**. A paginação de 100 itens torna a carga
  histórica lenta: usar SRC-01b para o histórico e a API para o incremental.
- **Status:** verificado-doc (spec lida em 2026-11-13)

## SRC-01b
### Câmara — arquivos em massa
- **Base:** `https://dadosabertos.camara.leg.br/arquivos/{conjunto}/{formato}/...`
  (formatos: csv, xlsx, ods, json, xml). Atualização quase sempre diária.
- **Conjuntos relevantes:** `deputados`, `deputadosOcupacoes`, `deputadosProfissoes`,
  `eventos-{ano}`, `eventosPresencaDeputados-{ano}`, `votacoes-{ano}`, `proposicoesTemas-{ano}`
  (tema oficial de cada proposição; usado na lista de projetos),
  `votacoesVotos-{ano}`, `votacoesOrientacoes-{ano}`, `votacoesObjetos-{ano}`,
  `votacoesProposicoes-{ano}`, `proposicoes-{ano}`, `proposicoesAutores-{ano}`,
  `proposicoesTemas-{ano}`, `orgaos`, `orgaosDeputados-L{legislatura}`, `frentes`,
  `frentesDeputados`, `legislaturas`, `legislaturasMesas`, `funcionarios`.
- **Uso:** carga histórica e reconciliação com a API. MET-01 (`eventos`), MET-03
  (`proposicoes`, `proposicoesAutores`, `proposicoesTramitacoes`).
- **Campos usados para o cidadão (2026-11-13):** `ementa` (100%), `ementaDetalhada` (~7%),
  `keywords` (100%, indexação da Câmara), `ultimoStatus_regime`, `ultimoStatus_apreciacao`.
- **Proposições (verificado em 2026-11-13):** CSV UTF-8 com BOM, separador `;`, todos os
  campos entre aspas, textos com quebra de linha dentro das aspas. `proposicoes-{ano}`
  traz as apresentadas no ano com a situação **atual**; `proposicoesTramitacoes-{ano}`
  traz as tramitações **ocorridas** no ano (de qualquer proposição) e `siglaTipo` vem
  vazio. Tamanhos: ~25–50 MB por arquivo.
- **Download instável:** o servidor às vezes corta a conexão no meio (`terminated`). O
  cliente refaz a requisição; um arquivo cujo último registro está cortado é tratado
  como incompleto e a coleta falha (nunca aceitar como aviso).
- **Status:** verificado-uso

## SRC-01c
### Câmara — Cota para o Exercício da Atividade Parlamentar (CEAP)
- **URL:** `http://www.camara.leg.br/cotas/Ano-{ano}.{formato}[.zip]` (desde 2008;
  XML/JSON/CSV vêm em ZIP).
- **Uso:** MET-02. Cruzar o CNPJ do fornecedor com SRC-04.
- **Formato (verificado em 2026-11-13):** ZIP com uma entrada `Ano-{ano}.csv` (deflate,
  UTF-8 com BOM, separador `;`, 32 colunas). ~7 MB compactado e ~75 MB descompactado por
  ano (~210 mil linhas). O JSON equivalente tem ~225 MB: usar o CSV.
- **Colunas usadas:** `ideCadastro` (= id da API v2; vazio em despesas de liderança),
  `numAno`, `numMes`, `txtDescricao`, `txtFornecedor`, `txtCNPJCPF`, `vlrDocumento`,
  `vlrGlosa` (vazio = 0, acontece no auxílio-moradia), `vlrLiquido` (pode ser negativo:
  compensação de bilhete), `ideDocumento`, `urlDocumento` (PDF da nota).
- **Dados pessoais no arquivo (não vão para o banco):** `cpf` do deputado,
  `txtPassageiro`, e nome/CPF de fornecedor pessoa física.
- **Valor da cota por UF:** Anexo do Ato da Mesa 43/2009, com redação do Ato 270/2023
  (desde 01/02/2023) e atualização do Ato 244/2026 (desde 20/02/2026, valores publicados
  pela Câmara no "Guia para jornalistas", não no ato). Tabela em
  `packages/sources/src/ceap.ts`.
- **Limitações:** as notas fiscais digitalizadas estão em outro lugar (portal da Câmara).
  O arquivo do ano corrente muda todo dia, e o deputado tem 90 dias para apresentar a nota.
- **Status:** verificado-uso

## SRC-01d
### Câmara — webservices legados (SitCamaraWS)
- **Base:** `https://www.camara.leg.br/SitCamaraWS` · XML · sem auth.
- **Endpoints usados:**
  - `Deputados.asmx/ObterDeputados`: deputados em exercício com `matricula` e
    `ideCadastro` (= id da API v2). É a única ligação entre a frequência e o SRC-01.
  - `sessoesreunioes.asmx/ListarPresencasDia?data=DD/MM/AAAA&numLegislatura=57&numMatriculaParlamentar=&siglaPartido=&siglaUF=`:
    frequência oficial do dia em Plenário, por deputado: `descricaoFrequenciaDia`
    (`Presença`, `Ausência`, `Ausência justificada`), `justificativa` (ex.: "Licença
    para Tratamento de Saúde", "Missão Autorizada") e a frequência em cada sessão.
    **Todos os parâmetros são obrigatórios**, mesmo vazios (senão HTTP 400).
- **Uso:** MET-01. A API v2 e o `eventosPresencaDeputados` (SRC-01b) só registram quem
  esteve presente: não têm ausência justificada nem o motivo, que a MET-01 exige.
- **Limitações (medidas em 2026-11-13):**
  - Lento: 6–10 s por chamada, mesmo em dia sem sessão (`<dia />`). Por isso só se
    consultam os dias com `Sessão Deliberativa` no `eventos-{ano}` (SRC-01b).
  - Só lista quem estava em exercício no dia, o que resolve o denominador de suplentes.
  - `ObterDeputados` só traz quem está em exercício hoje: a matrícula de ex-deputados não
    é mapeada (em 08/10/2025, 482 de 515 carteiras mapeadas). Não afeta a MET-01, que é
    calculada para quem está em exercício.
  - `siglaPartido` vem truncado em 10 caracteres ("Republican"); não usar como partido.
  - **Não lista sessões conjuntas do Congresso** (devolve `<dia />` mesmo quando o
    `eventos` marca sessão naquele dia), embora a página "Presença em Plenário" do site
    as conte. Conferido em 2026-11-13 (13/03, 04/12 e 19/12/2025).
  - Valor `Presença (~)` em `descricaoFrequenciaDia`, sem legenda oficial (ver MET-01).
  - Serviço legado, sem documentação mantida: pode ser desligado. A coleta falha de forma
    explícita (validação estrita) se o formato mudar.
- **Status:** verificado-uso (respostas reais lidas em 2026-11-13)

## SRC-02
### TSE — Portal de Dados Abertos
- **URL:** https://dadosabertos.tse.jus.br (plataforma **CKAN**: API padrão em
  `/api/3/action/package_search`, `package_show`).
- **Conjuntos:** candidatos (por eleição), bens de candidatos, prestação de contas
  eleitorais (receitas, despesas, doadores), resultados por seção/zona.
- **Uso:** MET-05 e o vínculo deputado ↔ candidatura.
- **Limitações:** o vínculo entre a Câmara e o TSE não tem chave comum oficial. Casar por
  CPF quando disponível, senão por nome + UF + ano. Documentar a taxa de casamento.
  Existem restrições de LGPD em dados de candidatura.
- **Status:** a-verificar. A busca pela API CKAN foi bloqueada no ambiente em
  2026-11-13; testar os endpoints localmente.

## SRC-02b
### TSE — DivulgaCandContas
- **URL:** https://divulgacandcontas.tse.jus.br
- **Cobre:** bens, certidões criminais, propostas, contas de campanha (atualização a cada
  60 min durante a eleição).
- **Uso:** link "ver na fonte" para o usuário. Não usar como fonte de ingestão (não tem
  API oficial documentada).
- **Status:** verificado-terceiros

## SRC-03
### CGU — Portal da Transparência (API de dados)
- **Docs:** https://api.portaldatransparencia.gov.br/swagger-ui/index.html · spec:
  `https://api.portaldatransparencia.gov.br/v3/api-docs`
- **Auth:** chave obtida por cadastro de e-mail. O nome do header é `chave-api-dados`
  `[de memória; confirmar na spec]`.
- **Endpoints relevantes (lidos da spec):**
  - Emendas: `/api-de-dados/emendas`, `/api-de-dados/emendas/documentos/{codigo}`
  - Sanções: `/api-de-dados/ceis`, `/cnep`, `/ceaf`, `/cepim` (+ `/{id}`)
  - Despesas: `/api-de-dados/despesas/documentos-por-favorecido`,
    `/despesas/recursos-recebidos`
  - Viagens: `/api-de-dados/viagens`, `/viagens-por-cpf`
- **Uso:** métrica futura de emendas. Sanções de fornecedores da CEAP (MET-02).
- **Limitações:** há limite de requisições por minuto, maior de madrugada `[valores de
  memória; confirmar]`. Os dados de emendas começam em 2018.
- **Status:** verificado-doc (paths) / a-verificar (auth e limites)

## SRC-04
### Receita Federal — CNPJ (dados abertos)
- **URL:** seção de Dados Abertos da Receita. O caminho citado por terceiros é
  `https://dadosabertos.rfb.gov.br/CNPJ/dados_abertos_cnpj/` (a verificar).
- **Formato:** CSV `;`, ISO-8859-1, particionado. Arquivos: empresas, estabelecimentos,
  sócios. Atualização mensal (fontes divergem).
- **Uso:** MET-02, sinais auditáveis de fornecedores (data de abertura, sócios).
- **Limitações:** CPF de sócios mascarado (só os 6 dígitos do meio). Não existe API
  oficial gratuita para consulta individual. O volume é grande (dezenas de GB).
- **Status:** verificado-terceiros

## SRC-05
### Base dos Dados
- **URL:** https://basedosdados.org (BigQuery + pacotes Python/R).
- **Uso:** protótipo e validação cruzada. **Nunca é a fonte primária** (PRI-07).
- **Status:** a-verificar

## SRC-06
### CNJ — DataJud API Pública
- **Docs:** https://datajud-wiki.cnj.jus.br/api-publica · chave em `/api-publica/acesso`
  · termos de uso v1.2 (nov/2023).
- **Endpoint:** `https://api-publica.datajud.cnj.jus.br/api_publica_{tribunal}/_search`
  (Elasticsearch, um índice por tribunal).
- **Auth:** header `Authorization: APIKey {chave pública}`.
- **Uso:** MET-06 (metadados de processos em tribunais estaduais e federais).
- **Limitações:** só metadados, sem conteúdo. Busca por número de processo/classe: **não
  é uma busca por nome de parte confiável**. Há relatos de documentação desatualizada.
  Risco jurídico alto: só exibir com status claro (investigado ≠ réu ≠ condenado).
- **Status:** verificado-terceiros (wiki não aberta diretamente)

## SRC-07
### STF — Corte Aberta
- **URL:** https://portal.stf.jus.br/hotsites/corteaberta/ (Resolução 774/2022).
- **Formato:** downloads CSV e painéis (dados desde 2000).
- **Uso:** MET-06. Deputados federais têm foro no STF.
- **Limitações:** não tem API documentada. Uma pesquisa acadêmica (UnB, 2025) aponta
  dados incompletos. Processos sigilosos não aparecem.
- **Status:** verificado-terceiros

## SRC-08
### TCU — Contas julgadas irregulares (Cadirreg)
- **URL:** consulta no portal do TCU; dados abertos em `sites.tcu.gov.br/dados-abertos`.
  A lista é entregue ao TSE em ano eleitoral.
- **Formato:** consulta web com exportação HTML/CSV (segundo PDF de 2018).
- **Uso:** MET-06.
- **Limitações:** não foi encontrado webservice. Estar na lista **não** implica
  inelegibilidade automática.
- **Status:** a-verificar

## SRC-09
### Transferegov — emendas e transferências especiais
- **URL:** https://www.gov.br/transferegov/pt-br/ferramentas-gestao/dados-abertos
  (há página de API do módulo TED; verificar o módulo de transferências especiais).
- **Uso:** rastrear a execução das emendas (inclusive "emendas Pix").
- **Status:** a-verificar

## SRC-10
### Tesouro Transparente — emendas
- **URL:** CKAN do Tesouro Transparente, dataset de emendas, com PDF de metadados.
- **Uso:** validação cruzada com SRC-03.
- **Status:** verificado-terceiros

---

## Fora do escopo (por ora)
- Redes sociais do deputado (sem fonte oficial, risco de viés de seleção).
- Diário Oficial da União (nomeações): avaliar depois.
- Notícias e imprensa: o portal não faz curadoria editorial (PRI-01).
