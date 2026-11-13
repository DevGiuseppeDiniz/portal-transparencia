-- DEC-10 — proveniência obrigatória. PostgreSQL.
-- Toda linha de staging/core/metrics referencia a coleta que a gerou.

CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS metrics;

CREATE TABLE raw.coleta (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fonte_id        text        NOT NULL,
    url_requisitada text        NOT NULL,
    metodo          text        NOT NULL CHECK (metodo IN ('api', 'arquivo')),
    iniciada_em     timestamptz NOT NULL DEFAULT now(),
    finalizada_em   timestamptz,
    status_http     integer,
    status          text        NOT NULL DEFAULT 'em_andamento'
                    CHECK (status IN ('em_andamento', 'sucesso', 'parcial', 'falha')),
    hash_conteudo   text        CHECK (hash_conteudo ~ '^[0-9a-f]{64}$'),
    caminho_raw     text,
    versao_coletor  text        NOT NULL,
    registros       integer     CHECK (registros >= 0),
    erro            text,
    -- Coleta concluída com sucesso precisa provar o que baixou.
    CHECK (status <> 'sucesso' OR (hash_conteudo IS NOT NULL AND caminho_raw IS NOT NULL AND finalizada_em IS NOT NULL))
);

CREATE INDEX coleta_fonte_iniciada_idx ON raw.coleta (fonte_id, iniciada_em DESC);

-- Append-only: coleta registrada não é apagada, e só os campos de conclusão mudam.
CREATE FUNCTION raw.coleta_imutavel() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'raw.coleta é append-only: DELETE proibido (DEC-10)';
    END IF;
    IF OLD.status <> 'em_andamento' THEN
        RAISE EXCEPTION 'raw.coleta %: coleta já concluída não pode ser alterada (DEC-10)', OLD.id;
    END IF;
    IF NEW.id <> OLD.id OR NEW.fonte_id <> OLD.fonte_id OR NEW.url_requisitada <> OLD.url_requisitada
       OR NEW.metodo <> OLD.metodo OR NEW.iniciada_em <> OLD.iniciada_em OR NEW.versao_coletor <> OLD.versao_coletor THEN
        RAISE EXCEPTION 'raw.coleta %: identidade da coleta não pode mudar (DEC-10)', OLD.id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER coleta_imutavel
    BEFORE UPDATE OR DELETE ON raw.coleta
    FOR EACH ROW EXECUTE FUNCTION raw.coleta_imutavel();

-- Papéis (SEG-02, SEG-03). Senhas definidas fora do código.
-- portal_web: só leitura de core e metrics. portal_ingest: escreve em tudo.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'portal_web') THEN
        CREATE ROLE portal_web NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'portal_ingest') THEN
        CREATE ROLE portal_ingest NOLOGIN;
    END IF;
END;
$$;

GRANT USAGE ON SCHEMA core, metrics TO portal_web;
ALTER DEFAULT PRIVILEGES IN SCHEMA core    GRANT SELECT ON TABLES TO portal_web;
ALTER DEFAULT PRIVILEGES IN SCHEMA metrics GRANT SELECT ON TABLES TO portal_web;

GRANT USAGE ON SCHEMA raw, staging, core, metrics TO portal_ingest;
GRANT SELECT, INSERT, UPDATE ON raw.coleta TO portal_ingest;
ALTER DEFAULT PRIVILEGES IN SCHEMA staging, core, metrics
    GRANT SELECT, INSERT, UPDATE ON TABLES TO portal_ingest;
