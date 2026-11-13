-- MET-01 — presença. Fontes: SRC-01b (eventos), SRC-01d (matrícula e frequência).
-- Mesmo padrão da 0002: staging append-only (histórico), core = estado atual com a coleta
-- que o produziu (DEC-10).

-- --- Eventos (SRC-01b, eventos-{ano}.json) --------------------------------------------
CREATE TABLE staging.camara_evento (
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL CHECK (fonte_id = 'SRC-01b'),
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL,
    id_evento          integer     NOT NULL CHECK (id_evento > 0),
    -- Horário de Brasília, como a Câmara publica (sem fuso).
    data_hora_inicio   timestamp   NOT NULL,
    descricao_tipo     text        NOT NULL,
    situacao           text,
    local              text,
    PRIMARY KEY (coleta_id, id_evento)
);
CREATE TRIGGER camara_evento_somente_insercao
    BEFORE UPDATE OR DELETE ON staging.camara_evento
    FOR EACH ROW EXECUTE FUNCTION staging.somente_insercao();

CREATE TABLE core.evento (
    id_evento          integer     PRIMARY KEY,
    data_hora_inicio   timestamp   NOT NULL,
    descricao_tipo     text        NOT NULL,
    situacao           text,
    local              text,
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL,
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL
);
CREATE INDEX evento_tipo_data_idx ON core.evento (descricao_tipo, data_hora_inicio);

-- --- Matrícula ↔ id (SRC-01d, ObterDeputados) ------------------------------------------
CREATE TABLE staging.camara_matricula (
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL CHECK (fonte_id = 'SRC-01d'),
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL,
    matricula          integer     NOT NULL CHECK (matricula > 0),
    id_camara          integer     NOT NULL CHECK (id_camara > 0),
    nome_parlamentar   text        NOT NULL,
    condicao           text        NOT NULL,
    sigla_uf           text        NOT NULL CHECK (sigla_uf ~ '^[A-Z]{2}$'),
    PRIMARY KEY (coleta_id, matricula)
);
CREATE TRIGGER camara_matricula_somente_insercao
    BEFORE UPDATE OR DELETE ON staging.camara_matricula
    FOR EACH ROW EXECUTE FUNCTION staging.somente_insercao();

-- Acumula: ex-deputado continua mapeado (a frequência antiga dele ainda aponta para a matrícula).
CREATE TABLE core.deputado_matricula (
    matricula          integer     PRIMARY KEY,
    id_camara          integer     NOT NULL,
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL,
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL
);
CREATE INDEX deputado_matricula_id_idx ON core.deputado_matricula (id_camara);

-- --- Frequência no Plenário (SRC-01d, ListarPresencasDia) ------------------------------
CREATE TABLE staging.camara_presenca_dia (
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL CHECK (fonte_id = 'SRC-01d'),
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL,
    data               date        NOT NULL,
    matricula          integer     NOT NULL CHECK (matricula > 0),
    nome_parlamentar   text        NOT NULL,
    sigla_partido      text,
    sigla_uf           text        NOT NULL CHECK (sigla_uf ~ '^[A-Z]{2}$'),
    frequencia         text        NOT NULL CHECK (frequencia IN ('Presença', 'Ausência', 'Ausência justificada')),
    justificativa      text,
    sessoes            integer     NOT NULL CHECK (sessoes >= 0),
    sessoes_presente   integer     NOT NULL CHECK (sessoes_presente >= 0),
    PRIMARY KEY (coleta_id, matricula)
);
CREATE TRIGGER camara_presenca_dia_somente_insercao
    BEFORE UPDATE OR DELETE ON staging.camara_presenca_dia
    FOR EACH ROW EXECUTE FUNCTION staging.somente_insercao();

-- Um dia por coleta: a coleta mais recente do dia substitui as linhas daquele dia
-- (justificativas podem ser registradas depois). O histórico fica no staging.
CREATE TABLE core.presenca_dia (
    data               date        NOT NULL,
    matricula          integer     NOT NULL,
    frequencia         text        NOT NULL,
    justificativa      text,
    sessoes            integer     NOT NULL,
    sessoes_presente   integer     NOT NULL,
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL,
    obtido_em          timestamptz NOT NULL,
    url_origem_publica text        NOT NULL,
    PRIMARY KEY (data, matricula)
);
CREATE INDEX presenca_dia_matricula_idx ON core.presenca_dia (matricula, data);

-- Dias já coletados com sucesso (inclusive os sem frequência registrada, que não geram linha).
CREATE TABLE core.presenca_dia_coletado (
    data               date        PRIMARY KEY,
    qtde_sessoes       integer     NOT NULL,
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    obtido_em          timestamptz NOT NULL
);

-- --- Camada metrics ------------------------------------------------------------------
-- Cada execução de cálculo é registrada com o método e as coletas usadas (DEC-10).
-- Append-only: um número publicado nunca muda; um recálculo gera um novo registro.
CREATE TABLE metrics.calculo (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    metrica            text        NOT NULL CHECK (metrica ~ '^MET-[0-9]{2}$'),
    versao_metodo      text        NOT NULL,
    periodo_inicio     date        NOT NULL,
    periodo_fim        date        NOT NULL CHECK (periodo_fim >= periodo_inicio),
    calculado_em       timestamptz NOT NULL DEFAULT now(),
    coleta_ids         uuid[]      NOT NULL,
    versao_calculo     text        NOT NULL
);
CREATE INDEX calculo_metrica_idx ON metrics.calculo (metrica, calculado_em DESC);

CREATE FUNCTION metrics.somente_insercao() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION '%.% é append-only: % proibido (DEC-10)', TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP;
END;
$$;
CREATE TRIGGER calculo_somente_insercao
    BEFORE UPDATE OR DELETE ON metrics.calculo
    FOR EACH ROW EXECUTE FUNCTION metrics.somente_insercao();

CREATE TABLE metrics.met01_presenca (
    calculo_id                 uuid    NOT NULL REFERENCES metrics.calculo (id),
    id_camara                  integer NOT NULL,
    dias                       integer NOT NULL CHECK (dias >= 0),
    presencas                  integer NOT NULL CHECK (presencas >= 0),
    ausencias_justificadas     integer NOT NULL CHECK (ausencias_justificadas >= 0),
    ausencias_nao_justificadas integer NOT NULL CHECK (ausencias_nao_justificadas >= 0),
    taxa_presenca              double precision CHECK (taxa_presenca BETWEEN 0 AND 1),
    entra_na_referencia        boolean NOT NULL,
    PRIMARY KEY (calculo_id, id_camara),
    CHECK (presencas + ausencias_justificadas + ausencias_nao_justificadas = dias)
);
CREATE TRIGGER met01_presenca_somente_insercao
    BEFORE UPDATE OR DELETE ON metrics.met01_presenca
    FOR EACH ROW EXECUTE FUNCTION metrics.somente_insercao();

-- Referência da Câmara (PRI-02): uma linha por cálculo.
CREATE TABLE metrics.met01_referencia (
    calculo_id         uuid    PRIMARY KEY REFERENCES metrics.calculo (id),
    n                  integer NOT NULL CHECK (n > 0),
    mediana            double precision NOT NULL,
    p25                double precision NOT NULL,
    p75                double precision NOT NULL,
    minimo             double precision NOT NULL,
    maximo             double precision NOT NULL,
    min_dias           integer NOT NULL
);
CREATE TRIGGER met01_referencia_somente_insercao
    BEFORE UPDATE OR DELETE ON metrics.met01_referencia
    FOR EACH ROW EXECUTE FUNCTION metrics.somente_insercao();
