-- MET-02 mês a mês: gasto e valor-base de cada mês do período, por deputado, para o gráfico
-- mensal. Mesma proveniência do cálculo (metrics.calculo). Append-only.

CREATE TABLE metrics.met02_mes (
    calculo_id         uuid    NOT NULL REFERENCES metrics.calculo (id),
    id_camara          integer NOT NULL,
    mes                text    NOT NULL CHECK (mes ~ '^[0-9]{4}-[0-9]{2}$'),
    em_exercicio       boolean NOT NULL,
    -- Gasto do mês (centavos). Fora do exercício fica registrado, mas não entra no total.
    gasto_centavos     bigint  NOT NULL,
    valor_base_centavos bigint NOT NULL,
    PRIMARY KEY (calculo_id, id_camara, mes)
);

CREATE TRIGGER met02_mes_somente_insercao
    BEFORE UPDATE OR DELETE ON metrics.met02_mes
    FOR EACH ROW EXECUTE FUNCTION metrics.somente_insercao();
