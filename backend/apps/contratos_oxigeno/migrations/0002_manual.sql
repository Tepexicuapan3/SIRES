-- =============================================================================
-- Migración manual 0002 — ContratoOxigeno: domicilio desglosado, teléfonos
-- y datos médicos del formato de oxígeno.
--
-- Correr en pgAdmin 4 (Query Tool) SOLO si en ese ambiente la tabla
-- "contratos_oxigeno" ya existe pero la migración 0002 de Django todavía
-- no se aplicó (verificar antes con el SELECT del Paso 0).
-- =============================================================================

-- ── Paso 0: verificar qué migraciones ya están registradas ──────────────────
-- Si "0002_contratooxigeno_alcaldia_contratooxigeno_calle_and_more" ya aparece
-- en el resultado, NO corras este script — ya está aplicado.
SELECT app, name, applied
FROM django_migrations
WHERE app = 'contratos_oxigeno'
ORDER BY applied;

-- ── Paso 1: agregar las columnas nuevas ──────────────────────────────────────
BEGIN;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "alcaldia" varchar(100) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "alcaldia" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "calle" varchar(150) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "calle" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "celular" varchar(20) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "celular" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "colonia" varchar(100) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "colonia" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "cp" varchar(10) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "cp" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "entre_calle_1" varchar(150) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "entre_calle_1" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "entre_calle_2" varchar(150) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "entre_calle_2" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "especialidad" varchar(100) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "especialidad" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "ext_tel" varchar(10) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "ext_tel" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "hospital_azura" varchar(10) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "hospital_azura" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "institucion_referencia" varchar(150) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "institucion_referencia" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "medico_tratante" varchar(150) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "medico_tratante" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "medico_tratante_referencia" varchar(150) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "medico_tratante_referencia" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "num_ext" varchar(20) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "num_ext" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "num_int" varchar(20) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "num_int" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "tel_oficina" varchar(20) DEFAULT '' NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "tel_oficina" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "tercer_nivel" boolean DEFAULT false NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "tercer_nivel" DROP DEFAULT;

ALTER TABLE "contratos_oxigeno" ADD COLUMN "tramite_subsecuente" boolean DEFAULT false NOT NULL;
ALTER TABLE "contratos_oxigeno" ALTER COLUMN "tramite_subsecuente" DROP DEFAULT;

-- ── Paso 2: avisarle a Django que esta migración ya está aplicada ───────────
-- (necesario para que "manage.py migrate" no intente volver a crearlas)
INSERT INTO django_migrations (app, name, applied)
VALUES (
    'contratos_oxigeno',
    '0002_contratooxigeno_alcaldia_contratooxigeno_calle_and_more',
    NOW()
);

COMMIT;
