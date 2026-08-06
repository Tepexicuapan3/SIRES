-- =============================================================================
-- MIGRACIÓN 0005: cd_laboral en det_usuarios
-- Schema: sires
-- Base: SISEM principal (50.192.41.223)
-- =============================================================================

ALTER TABLE sires.det_usuarios
    ADD COLUMN IF NOT EXISTS cd_laboral VARCHAR(100) NULL;

-- Verificación
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'sires'
    AND table_name = 'det_usuarios'
    AND column_name = 'cd_laboral';
