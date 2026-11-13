-- MET-03 — funil legislativo. Fonte: SRC-01b (proposicoes, proposicoesAutores,
-- proposicoesTramitacoes, um arquivo por ano). O raw guarda o arquivo inteiro; o staging
-- guarda o recorte usado (PL/PLP/PEC e o que se liga a elas), sempre com a coleta de origem.

CREATE TABLE staging.camara_proposicao (
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL CHECK (fonte_id = 'SRC-01b'),
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL,
    id_proposicao      integer     NOT NULL,
    sigla_tipo         text        NOT NULL CHECK (sigla_tipo IN ('PL', 'PLP', 'PEC')),
    numero             integer     NOT NULL,
    ano                integer     NOT NULL,
    ementa             text        NOT NULL,
    data_apresentacao  timestamp   NOT NULL,
    id_principal       integer,
    situacao           text,
    data_situacao      timestamp,
    url_inteiro_teor   text,
    PRIMARY KEY (coleta_id, id_proposicao)
);

CREATE TABLE staging.camara_proposicao_autor (
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL CHECK (fonte_id = 'SRC-01b'),
    obtido_em          timestamptz NOT NULL,
    linha              integer     NOT NULL,
    id_proposicao      integer     NOT NULL,
    id_deputado        integer,
    tipo_autor         text        NOT NULL,
    ordem_assinatura   integer     NOT NULL,
    PRIMARY KEY (coleta_id, linha)
);
CREATE INDEX camara_proposicao_autor_idx ON staging.camara_proposicao_autor (coleta_id, id_proposicao);

CREATE TABLE staging.camara_tramitacao (
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL CHECK (fonte_id = 'SRC-01b'),
    obtido_em          timestamptz NOT NULL,
    linha              integer     NOT NULL,
    id_proposicao      integer     NOT NULL,
    data_hora          timestamp   NOT NULL,
    sequencia          integer,
    sigla_orgao        text        NOT NULL,
    descricao          text        NOT NULL,
    cod_situacao       integer,
    PRIMARY KEY (coleta_id, linha)
);
CREATE INDEX camara_tramitacao_idx ON staging.camara_tramitacao (coleta_id, id_proposicao);

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['camara_proposicao', 'camara_proposicao_autor', 'camara_tramitacao'] LOOP
        EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON staging.%I
                        FOR EACH ROW EXECUTE FUNCTION staging.somente_insercao()', t || '_somente_insercao', t);
    END LOOP;
END;
$$;

-- --- metrics ---------------------------------------------------------------------------
CREATE TABLE metrics.met03_funil (
    calculo_id                   uuid    NOT NULL REFERENCES metrics.calculo (id),
    id_camara                    integer NOT NULL,
    apresentadas                 integer NOT NULL,
    comissao                     integer NOT NULL,
    alem_comissao                integer NOT NULL,
    aprovadas_camara             integer NOT NULL,
    leis                         integer NOT NULL,
    apensadas                    integer NOT NULL,
    arquivadas                   integer NOT NULL,
    retiradas                    integer NOT NULL,
    devolvidas                   integer NOT NULL,
    taxa_lei                     double precision,
    PRIMARY KEY (calculo_id, id_camara),
    CHECK (apresentadas >= comissao AND comissao >= alem_comissao AND alem_comissao >= aprovadas_camara AND aprovadas_camara >= leis)
);

CREATE TABLE metrics.met03_referencia (
    calculo_id         uuid    NOT NULL REFERENCES metrics.calculo (id),
    indicador          text    NOT NULL CHECK (indicador IN ('apresentada', 'comissao', 'alem_comissao', 'aprovada_camara', 'lei', 'taxa_lei')),
    n                  integer NOT NULL CHECK (n > 0),
    media              double precision NOT NULL,
    mediana            double precision NOT NULL,
    p25                double precision NOT NULL,
    p75                double precision NOT NULL,
    minimo             double precision NOT NULL,
    maximo             double precision NOT NULL,
    PRIMARY KEY (calculo_id, indicador)
);

-- Cada projeto do deputado com o estágio alcançado: a lista auditável por trás do funil.
CREATE TABLE metrics.met03_proposicao (
    calculo_id         uuid    NOT NULL REFERENCES metrics.calculo (id),
    id_camara          integer NOT NULL,
    id_proposicao      integer NOT NULL,
    sigla_tipo         text    NOT NULL,
    numero             integer NOT NULL,
    ano                integer NOT NULL,
    ementa             text    NOT NULL,
    data_apresentacao  timestamp NOT NULL,
    estagio            text    NOT NULL CHECK (estagio IN ('apresentada', 'comissao', 'alem_comissao', 'aprovada_camara', 'lei')),
    apensada           boolean NOT NULL,
    encerrada          text    CHECK (encerrada IN ('arquivada', 'retirada', 'devolvida')),
    situacao           text,
    PRIMARY KEY (calculo_id, id_proposicao)
);
CREATE INDEX met03_proposicao_deputado_idx ON metrics.met03_proposicao (calculo_id, id_camara);

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['met03_funil', 'met03_referencia', 'met03_proposicao'] LOOP
        EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON metrics.%I
                        FOR EACH ROW EXECUTE FUNCTION metrics.somente_insercao()', t || '_somente_insercao', t);
    END LOOP;
END;
$$;
