-- Schema de las tablas replicadas desde Oracle (ver apps.administracion.services.sync_service
-- y apps.administracion.use_cases.expedientes). Solo estructura, sin datos: las tablas se
-- van llenando via el sync Oracle -> Postgres cuando el personal consulta/actualiza un expediente,
-- o via carga manual posterior.
--
-- Nombres de columna en minusculas y sin comillas a proposito: el SQL crudo en
-- buscar_expediente.py y el reflection dinamico de sync_service.py (information_schema.columns)
-- las referencian sin comillas, por lo que Postgres las resuelve en minusculas.

CREATE TABLE IF NOT EXISTS cat_clinicas (
    cd_clinica  varchar(10)  PRIMARY KEY,
    ds_clinica  varchar(100)
);

CREATE TABLE IF NOT EXISTS cat_empleados (
    no_exp                 varchar(20) PRIMARY KEY,
    ds_paterno             varchar(100),
    ds_materno             varchar(100),
    ds_nombre              varchar(100),
    cd_laboral             varchar(100),
    cve_cd_laboral         varchar(10),
    cve_baja               varchar(10),
    fec_baja               date,
    fe_nac                 date,
    fec_vig                date,
    no_edad                integer,
    cd_clinica             varchar(10),
    fec_ult_actualizacion  timestamp
);

CREATE TABLE IF NOT EXISTS cat_familiar (
    pk_num                 integer PRIMARY KEY,
    no_expf                varchar(20) NOT NULL,
    ds_paterno             varchar(100),
    ds_materno             varchar(100),
    ds_nombre              varchar(100),
    cd_parentesco          varchar(50),
    tp_der                 varchar(2),
    fe_nac                 date,
    no_edad                integer,
    fec_vig                date,
    cd_clinica             varchar(10),
    fec_ult_actualizacion  timestamp
);

CREATE TABLE IF NOT EXISTS dnt_fotos_credenciales (
    id_empleado       integer NOT NULL,
    tipo_foto         varchar(40),
    foto              bytea,
    fecha_toma        timestamp,
    fec_actualizacion timestamp,
    pk_num            integer,
    id_clave_foto     integer,
    UNIQUE (id_empleado, id_clave_foto)
);

CREATE INDEX IF NOT EXISTS idx_cat_empleados_cd_clinica ON cat_empleados (cd_clinica);
CREATE INDEX IF NOT EXISTS idx_cat_familiar_no_expf ON cat_familiar (no_expf);
CREATE INDEX IF NOT EXISTS idx_dnt_fotos_id_empleado ON dnt_fotos_credenciales (id_empleado);
