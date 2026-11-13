-- Detalhes dos projetos para o cidadão (sem IA e sem texto mantido à mão): tema oficial da
-- Câmara, palavras-chave da indexação, ementa detalhada, regime e quem decide (apreciação).
-- Fonte: SRC-01b (proposicoes-{ano}, proposicoesTemas-{ano}).

ALTER TABLE staging.camara_proposicao
    ADD COLUMN ementa_detalhada text,
    ADD COLUMN palavras_chave   text[] NOT NULL DEFAULT '{}',
    ADD COLUMN regime           text,
    ADD COLUMN apreciacao       text;

CREATE TABLE staging.camara_proposicao_tema (
    coleta_id          uuid        NOT NULL REFERENCES raw.coleta (id),
    fonte_id           text        NOT NULL CHECK (fonte_id = 'SRC-01b'),
    obtido_em          timestamptz NOT NULL,
    linha              integer     NOT NULL,
    id_proposicao      integer     NOT NULL,
    cod_tema           integer     NOT NULL,
    tema               text        NOT NULL,
    PRIMARY KEY (coleta_id, linha)
);
CREATE INDEX camara_proposicao_tema_idx ON staging.camara_proposicao_tema (coleta_id, id_proposicao);
CREATE TRIGGER camara_proposicao_tema_somente_insercao
    BEFORE UPDATE OR DELETE ON staging.camara_proposicao_tema
    FOR EACH ROW EXECUTE FUNCTION staging.somente_insercao();

ALTER TABLE metrics.met03_proposicao
    ADD COLUMN temas            text[] NOT NULL DEFAULT '{}',
    ADD COLUMN palavras_chave   text[] NOT NULL DEFAULT '{}',
    ADD COLUMN ementa_detalhada text,
    ADD COLUMN regime           text,
    ADD COLUMN apreciacao       text;

-- As coletas vigentes de proposições foram gravadas sem as colunas novas: a próxima coleta
-- precisa regravá-las mesmo que o arquivo da Câmara não tenha mudado (core é mutável;
-- staging e raw continuam intactos).
DELETE FROM core.coleta_vigente WHERE chave LIKE 'proposicoes:%';
