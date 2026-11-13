-- MET-02 — cota parlamentar. Fontes: SRC-01c (CEAP anual) e SRC-01 (histórico do mandato).
--
-- Volume: ~210 mil despesas por ano. Em vez de copiar tudo para o core, o core aponta qual
-- coleta é a vigente para cada arquivo (core.coleta_vigente), e as leituras filtram o
-- staging por essa coleta. O staging continua append-only e é o histórico (DEC-10).

CREATE TABLE core.coleta_vigente (
    chave              text        PRIMARY KEY,  -- ex.: 'ceap:2025', 'historico'
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    obtido_em          timestamptz NOT NULL
);

-- Sem CPF do deputado, nome de passageiro nem nome/CPF de fornecedor pessoa física (LGPD):
-- esses campos ficam só no arquivo bruto oficial.
CREATE TABLE staging.camara_despesa (
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL CHECK (fonte_id = 'SRC-01c'),
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL,
    linha              integer     NOT NULL,
    id_camara          integer,
    ano                smallint    NOT NULL,
    mes                smallint    NOT NULL CHECK (mes BETWEEN 1 AND 12),
    categoria          text        NOT NULL,
    subcota            integer     NOT NULL,
    fornecedor         text,
    cnpj               text        CHECK (cnpj ~ '^[0-9]{14}$'),
    tipo_fornecedor    text        NOT NULL CHECK (tipo_fornecedor IN ('PJ', 'PF', 'desconhecido')),
    data_emissao       date,
    valor_documento    bigint      NOT NULL,  -- centavos
    valor_glosa        bigint      NOT NULL,  -- centavos
    valor_liquido      bigint      NOT NULL,  -- centavos
    id_documento       bigint,
    url_documento      text,
    PRIMARY KEY (coleta_id, linha),
    CHECK (tipo_fornecedor <> 'PF' OR (fornecedor IS NULL AND cnpj IS NULL))
);
CREATE INDEX camara_despesa_deputado_idx ON staging.camara_despesa (coleta_id, id_camara, ano, mes);
CREATE TRIGGER camara_despesa_somente_insercao
    BEFORE UPDATE OR DELETE ON staging.camara_despesa
    FOR EACH ROW EXECUTE FUNCTION staging.somente_insercao();

CREATE TABLE staging.camara_historico (
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL CHECK (fonte_id = 'SRC-01'),
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL,
    id_camara          integer     NOT NULL,
    ordem              integer     NOT NULL,
    data_hora          timestamp   NOT NULL,
    situacao           text,
    descricao_status   text,
    id_legislatura     integer     NOT NULL,
    PRIMARY KEY (coleta_id, id_camara, ordem)
);
CREATE TRIGGER camara_historico_somente_insercao
    BEFORE UPDATE OR DELETE ON staging.camara_historico
    FOR EACH ROW EXECUTE FUNCTION staging.somente_insercao();

-- --- metrics ---------------------------------------------------------------------------
CREATE TABLE metrics.met02_cota (
    calculo_id          uuid    NOT NULL REFERENCES metrics.calculo (id),
    id_camara           integer NOT NULL,
    sigla_uf            text    NOT NULL,
    meses_exercicio     integer NOT NULL CHECK (meses_exercicio BETWEEN 0 AND 12),
    gasto_centavos      bigint  NOT NULL,
    teto_centavos       bigint  NOT NULL CHECK (teto_centavos >= 0),
    percentual_teto     double precision,
    concentracao_top3   double precision,
    total_fornecedores  integer NOT NULL,
    entra_na_referencia boolean NOT NULL,
    PRIMARY KEY (calculo_id, id_camara)
);

CREATE TABLE metrics.met02_categoria (
    calculo_id         uuid    NOT NULL REFERENCES metrics.calculo (id),
    id_camara          integer NOT NULL,
    categoria          text    NOT NULL,
    centavos           bigint  NOT NULL,
    PRIMARY KEY (calculo_id, id_camara, categoria)
);

CREATE TABLE metrics.met02_fornecedor (
    calculo_id         uuid    NOT NULL REFERENCES metrics.calculo (id),
    id_camara          integer NOT NULL,
    posicao            integer NOT NULL CHECK (posicao > 0),
    fornecedor         text    NOT NULL,
    cnpj               text,
    centavos           bigint  NOT NULL,
    documentos         integer NOT NULL,
    PRIMARY KEY (calculo_id, id_camara, posicao)
);

CREATE TABLE metrics.met02_referencia_uf (
    calculo_id         uuid    NOT NULL REFERENCES metrics.calculo (id),
    sigla_uf           text    NOT NULL,
    n                  integer NOT NULL CHECK (n > 0),
    media              double precision NOT NULL,
    mediana            double precision NOT NULL,
    p25                double precision NOT NULL,
    p75                double precision NOT NULL,
    minimo             double precision NOT NULL,
    maximo             double precision NOT NULL,
    min_meses          integer NOT NULL,
    PRIMARY KEY (calculo_id, sigla_uf)
);

-- O teto usado em cada mês do período, com a norma que o fixou (auditável na tela).
CREATE TABLE metrics.met02_teto (
    calculo_id         uuid    NOT NULL REFERENCES metrics.calculo (id),
    sigla_uf           text    NOT NULL,
    mes                text    NOT NULL CHECK (mes ~ '^[0-9]{4}-[0-9]{2}$'),
    teto_centavos      bigint  NOT NULL,
    norma              text    NOT NULL,
    fonte              text    NOT NULL,
    PRIMARY KEY (calculo_id, sigla_uf, mes)
);

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['met02_cota', 'met02_categoria', 'met02_fornecedor', 'met02_referencia_uf', 'met02_teto'] LOOP
        EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON metrics.%I
                        FOR EACH ROW EXECUTE FUNCTION metrics.somente_insercao()', t || '_somente_insercao', t);
    END LOOP;
END;
$$;
