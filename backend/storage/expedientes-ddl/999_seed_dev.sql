-- Seed de datos de prueba para entorno de DESARROLLO LOCAL unicamente.
-- Numeracion alta (999_) a proposito: la imagen oficial de postgres corre
-- todos los .sql de /docker-entrypoint-initdb.d en orden alfabetico, asi que
-- esto se ejecuta DESPUES de 001_schema.sql (que crea las tablas).
--
-- Permite probar de punta a punta el login OTP del portal "Citas en Linea"
-- (apps/portal_citas) sin depender de la BD "expedientes" remota de
-- produccion (50.192.43.35).
--
-- Titular de prueba: no_exp = 'TEST0001', nombre "Juan Perez Lopez",
-- nacido 1990-01-01 (mayor de edad) -> puede iniciar sesion por si mismo.
-- Familiar de prueba: mismo no_exp (no_expf), pk_num = 1, nombre
-- "Maria Perez Gonzalez", nacida 2016-03-15 (~10 anios, menor de edad al
-- 2026-07-30) -> NO puede iniciar sesion por su cuenta, pero es visible en
-- el nucleo del titular (ver apps/portal_citas/services/nucleo_service.py).
--
-- Idempotente: ON CONFLICT sobre la PK real de cada tabla (no_exp / pk_num)
-- para que re-ejecutar este archivo, o encontrarse un volumen ya
-- inicializado, no rompa nada.

INSERT INTO cat_empleados (
    no_exp,
    ds_paterno,
    ds_materno,
    ds_nombre,
    cd_laboral,
    cve_cd_laboral,
    cve_baja,
    fec_baja,
    fe_nac,
    fec_vig,
    no_edad,
    cd_clinica,
    fec_ult_actualizacion
) VALUES (
    'TEST0001',
    'Perez',
    'Lopez',
    'Juan',
    'ADMINISTRATIVO',
    '01',
    NULL,
    NULL,
    '1990-01-01',
    '2030-12-31',
    36,
    NULL,
    NOW()
)
ON CONFLICT (no_exp) DO NOTHING;

INSERT INTO cat_familiar (
    pk_num,
    no_expf,
    ds_paterno,
    ds_materno,
    ds_nombre,
    cd_parentesco,
    tp_der,
    fe_nac,
    no_edad,
    fec_vig,
    cd_clinica,
    fec_ult_actualizacion
) VALUES (
    1,
    'TEST0001',
    'Perez',
    'Gonzalez',
    'Maria',
    'HIJO(A)',
    'H',
    '2016-03-15',
    10,
    '2030-12-31',
    NULL,
    NOW()
)
ON CONFLICT (pk_num) DO NOTHING;
