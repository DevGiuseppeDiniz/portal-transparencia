-- "Presença (~)": dia com presença consolidada administrativamente, mas ausência na ata da
-- sessão. Pelo Ato da Mesa 191/2017, art. 2º, parágrafo único, a ausência na ata prevalece.
-- Vira uma categoria própria, exibida à parte e fora da taxa de presença (MET-01).

ALTER TABLE staging.camara_presenca_dia DROP CONSTRAINT camara_presenca_dia_frequencia_check;
ALTER TABLE staging.camara_presenca_dia ADD CONSTRAINT camara_presenca_dia_frequencia_check
    CHECK (frequencia IN ('Presença', 'Presença (~)', 'Ausência', 'Ausência justificada'));

ALTER TABLE metrics.met01_presenca ADD COLUMN presencas_sem_registro_na_sessao integer NOT NULL DEFAULT 0
    CHECK (presencas_sem_registro_na_sessao >= 0);
ALTER TABLE metrics.met01_presenca DROP CONSTRAINT met01_presenca_check;
ALTER TABLE metrics.met01_presenca ADD CONSTRAINT met01_presenca_soma_check
    CHECK (presencas + presencas_sem_registro_na_sessao + ausencias_justificadas + ausencias_nao_justificadas = dias);
