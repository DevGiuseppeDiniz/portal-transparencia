-- SRC-01 (Câmara, /deputados) → staging → core. Proveniência obrigatória (DEC-10).

-- staging: uma linha por deputado por coleta, exatamente como a fonte declarou.
-- Append-only: é o histórico. Mudança de partido/UF entre coletas fica registrada aqui.
CREATE TABLE staging.camara_deputado (
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL CHECK (fonte_id = 'SRC-01'),
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL,
    id_camara          integer     NOT NULL CHECK (id_camara > 0),
    nome               text        NOT NULL CHECK (nome <> ''),
    sigla_partido      text,
    sigla_uf           text        NOT NULL CHECK (sigla_uf ~ '^[A-Z]{2}$'),
    id_legislatura     integer     NOT NULL,
    url_foto           text,
    email              text,
    PRIMARY KEY (coleta_id, id_camara)
);

CREATE FUNCTION staging.somente_insercao() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION '%.% é append-only: % proibido (DEC-10)', TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP;
END;
$$;

CREATE TRIGGER camara_deputado_somente_insercao
    BEFORE UPDATE OR DELETE ON staging.camara_deputado
    FOR EACH ROW EXECUTE FUNCTION staging.somente_insercao();

-- core: o estado atual de cada deputado, apontando para a coleta que o produziu.
-- O histórico fica em staging; aqui só se atualiza a partir de uma coleta com sucesso.
CREATE TABLE core.deputado (
    id_camara          integer     PRIMARY KEY CHECK (id_camara > 0),
    nome               text        NOT NULL CHECK (nome <> ''),
    sigla_partido      text,
    sigla_uf           text        NOT NULL CHECK (sigla_uf ~ '^[A-Z]{2}$'),
    id_legislatura     integer     NOT NULL,
    url_foto           text,
    email              text,
    -- Estava na lista de "em exercício" da última coleta com sucesso.
    em_exercicio       boolean     NOT NULL,
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL,
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL
);

CREATE INDEX deputado_uf_em_exercicio_idx ON core.deputado (sigla_uf) WHERE em_exercicio;
