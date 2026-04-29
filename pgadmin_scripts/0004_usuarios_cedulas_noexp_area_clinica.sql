-- =============================================================================
-- MIGRACIÓN 0004: Cédulas profesionales + no_exp + área clínica en usuarios
-- Schema: sires
-- Base: SISEM principal (50.192.41.223)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SCRIPT 1: Modificar det_usuarios
-- -----------------------------------------------------------------------------
ALTER TABLE sires.det_usuarios
    ADD COLUMN IF NOT EXISTS no_exp VARCHAR(20) NULL;

ALTER TABLE sires.det_usuarios
    ADD COLUMN IF NOT EXISTS id_area_clinica INTEGER NULL
        REFERENCES sires.cat_areas_clinicas(id_area_clinica)
        ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_det_usuarios_area_clinica
    ON sires.det_usuarios(id_area_clinica);

-- -----------------------------------------------------------------------------
-- SCRIPT 2: Crear tabla det_usuario_cedulas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sires.det_usuario_cedulas (
    id           BIGSERIAL    PRIMARY KEY,
    id_usuario   BIGINT       NOT NULL
                     REFERENCES sires.sy_usuarios(id_usuario)
                     ON DELETE CASCADE,
    numero       VARCHAR(30)  NOT NULL,
    tipo         VARCHAR(20)  NOT NULL
                     DEFAULT 'PROFESIONAL'
                     CHECK (tipo IN ('PROFESIONAL', 'ESPECIALIDAD', 'SUBESPECIALIDAD')),
    es_principal BOOLEAN      NOT NULL DEFAULT FALSE,
    orden        INTEGER      NOT NULL,

    CONSTRAINT uq_cedula_usuario_orden UNIQUE (id_usuario, orden)
);

CREATE INDEX IF NOT EXISTS idx_cedulas_id_usuario
    ON sires.det_usuario_cedulas(id_usuario);

-- Solo puede haber UNA cédula principal por usuario
CREATE UNIQUE INDEX IF NOT EXISTS uq_cedula_principal_por_usuario
    ON sires.det_usuario_cedulas(id_usuario)
    WHERE es_principal = TRUE;

-- -----------------------------------------------------------------------------
-- SCRIPT 3: Verificación
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'sires'
  AND table_name = 'det_usuarios'
  AND column_name IN ('no_exp', 'id_area_clinica')
ORDER BY column_name;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'sires'
  AND table_name = 'det_usuario_cedulas'
ORDER BY ordinal_position;
