-- =====================================================
-- MIGRATION 002: RBAC 2.0 - Modify Existing Tables
-- =====================================================
-- Descripción: Agregar campos necesarios a tablas existentes
-- Autor: SIRES Dev Team
-- Fecha: 2025-12-29
-- Versión: 1.0.0
--
-- IMPORTANTE:
-- 1. Este script MODIFICA tablas existentes
-- 2. Hacer BACKUP antes de ejecutar
-- 3. Se agregan columnas con valores DEFAULT seguros
-- 4. Compatible con MySQL 8.0+
-- =====================================================

USE SIRES;

-- =====================================================
-- PASO 1: Verificar estado actual de cat_roles
-- =====================================================

-- Ver estructura actual
DESCRIBE cat_roles;

-- =====================================================
-- PASO 2: Agregar campos a cat_roles
-- =====================================================

-- Campo 1: landing_route (ruta de redirección post-login)
ALTER TABLE cat_roles 
ADD COLUMN landing_route VARCHAR(100) DEFAULT '/dashboard' 
COMMENT 'Ruta de redirección post-login (ej: /consultas, /recepcion, /farmacia)'
AFTER desc_rol;

-- Campo 2: priority (prioridad del rol)
ALTER TABLE cat_roles 
ADD COLUMN priority INT UNSIGNED DEFAULT 0 
COMMENT 'Prioridad del rol (mayor número = mayor prioridad). Usado cuando un usuario tiene múltiples roles.'
AFTER landing_route;

-- Campo 3: is_admin (flag de administrador)
ALTER TABLE cat_roles 
ADD COLUMN is_admin TINYINT(1) DEFAULT 0 
COMMENT 'Si es 1, el rol tiene acceso completo (bypass de permisos). Solo para ADMINISTRADOR.'
AFTER priority;

-- =====================================================
-- PASO 3: Actualizar datos existentes en cat_roles
-- =====================================================

-- ADMINISTRADOR: acceso total, máxima prioridad, landing en admin
UPDATE cat_roles 
SET 
    is_admin = 1,
    landing_route = '/admin/dashboard',
    priority = 100
WHERE rol = 'ADMINISTRADOR';

-- MEDICOS: landing en consultas, prioridad alta
UPDATE cat_roles 
SET 
    landing_route = '/consultas',
    priority = 80
WHERE rol = 'MEDICOS';

-- ESPECIALISTAS: landing en consultas especializadas
UPDATE cat_roles 
SET 
    landing_route = '/consultas/especialidades',
    priority = 75
WHERE rol = 'ESPECIALISTAS';

-- RECEPCION: landing en recepción
UPDATE cat_roles 
SET 
    landing_route = '/recepcion',
    priority = 60
WHERE rol = 'RECEPCION';

-- FARMACIA: landing en farmacia
UPDATE cat_roles 
SET 
    landing_route = '/farmacia',
    priority = 50
WHERE rol = 'FARMACIA';

-- JEFATURA CLINICA: landing en dashboard clínico
UPDATE cat_roles 
SET 
    landing_route = '/clinica/dashboard',
    priority = 85
WHERE rol = 'JEFATURA CLINICA';

-- GERENCIA: landing en reportes/dashboard gerencial
UPDATE cat_roles 
SET 
    landing_route = '/gerencia/dashboard',
    priority = 90
WHERE rol = 'GERENCIA';

-- URGENCIAS: landing en urgencias
UPDATE cat_roles 
SET 
    landing_route = '/urgencias',
    priority = 70
WHERE rol = 'URGENCIAS';

-- VISITADORES: landing en consultas visitadores
UPDATE cat_roles 
SET 
    landing_route = '/consultas/visitadores',
    priority = 65
WHERE rol = 'VISITADORES';

-- LICENCIA Y SM21: landing específico
UPDATE cat_roles 
SET 
    landing_route = '/consultas/licencias',
    priority = 55
WHERE rol = 'LICENCIA Y SM21';

-- LABORAL: landing en medicina laboral
UPDATE cat_roles 
SET 
    landing_route = '/laboral',
    priority = 55
WHERE rol = 'LABORAL';

-- TRANS-RECETA: landing en transcripción
UPDATE cat_roles 
SET 
    landing_route = '/farmacia/transcripcion',
    priority = 45
WHERE rol = 'TRANS-RECETA';

-- HOSP-RECEPCION: landing en recepción hospital
UPDATE cat_roles 
SET 
    landing_route = '/hospital/recepcion',
    priority = 60
WHERE rol = 'HOSP-RECEPCION';

-- HOSP-FACTURA: landing en facturación
UPDATE cat_roles 
SET 
    landing_route = '/hospital/facturacion',
    priority = 55
WHERE rol = 'HOSP-FACTURA';

-- HOSP-MEDICO: landing en consultas hospital
UPDATE cat_roles 
SET 
    landing_route = '/hospital/consultas',
    priority = 75
WHERE rol = 'HOSP-MEDICO';

-- HOSP-COORDINACION: landing en coordinación
UPDATE cat_roles 
SET 
    landing_route = '/hospital/coordinacion',
    priority = 80
WHERE rol = 'HOSP -COORDINACION';

-- HOSP-TRABAJO SOCIAL: landing en trabajo social
UPDATE cat_roles 
SET 
    landing_route = '/hospital/trabajo-social',
    priority = 60
WHERE rol = 'HOSP - TRABAJO SOCIAL';

-- URGENCIAS RECEPCION H: landing en urgencias
UPDATE cat_roles 
SET 
    landing_route = '/hospital/urgencias',
    priority = 70
WHERE rol = 'URGENCIAS RECEPCION H';

-- RECEPCION CONSULTA EXTERNA H
UPDATE cat_roles 
SET 
    landing_route = '/hospital/consulta-externa',
    priority = 60
WHERE rol = 'RECEPCION CONSULTA EXTERNA H';

-- RECOEX
UPDATE cat_roles 
SET 
    landing_route = '/recepcion/consulta-externa',
    priority = 60
WHERE rol = 'RECOEX';

-- RECEPCION ADMISION H
UPDATE cat_roles 
SET 
    landing_route = '/hospital/admision',
    priority = 60
WHERE rol = 'RECEPCION ADMISION H';

-- PERSONALIZADO: landing genérico, prioridad baja
UPDATE cat_roles 
SET 
    landing_route = '/dashboard',
    priority = 10
WHERE rol = 'PERSONALIZADO';

-- =====================================================
-- PASO 4: Verificar estado actual de users_roles
-- =====================================================

-- Ver estructura actual
DESCRIBE users_roles;

-- =====================================================
-- PASO 5: Agregar campo is_primary a users_roles
-- =====================================================

-- Campo: is_primary (indica el rol principal del usuario)
ALTER TABLE users_roles 
ADD COLUMN is_primary TINYINT(1) DEFAULT 0 
COMMENT 'Indica si este es el rol principal del usuario (solo 1 por usuario). Usado para determinar landing_route cuando hay múltiples roles.'
AFTER tp_asignacion;

-- =====================================================
-- PASO 6: Marcar rol principal para usuarios existentes
-- =====================================================

-- Para usuarios con un solo rol, marcarlo como primary
UPDATE users_roles ur
SET is_primary = 1
WHERE id_usuario IN (
    SELECT id_usuario 
    FROM (
        SELECT id_usuario, COUNT(*) as roles_count
        FROM users_roles
        WHERE est_usr_rol = 'A'
        GROUP BY id_usuario
        HAVING roles_count = 1
    ) AS single_role_users
);

-- Para usuarios con múltiples roles, marcar el de mayor prioridad como primary
-- (esto asume que ya ejecutaste las actualizaciones de priority en cat_roles)
UPDATE users_roles ur
INNER JOIN (
    SELECT 
        ur2.id_usuario,
        ur2.id_usr_roles,
        ROW_NUMBER() OVER (
            PARTITION BY ur2.id_usuario 
            ORDER BY cr.priority DESC, ur2.fch_alta ASC
        ) as rn
    FROM users_roles ur2
    INNER JOIN cat_roles cr ON ur2.id_rol = cr.id_rol
    WHERE ur2.est_usr_rol = 'A'
) ranked
ON ur.id_usr_roles = ranked.id_usr_roles
SET ur.is_primary = 1
WHERE ranked.rn = 1;

-- =====================================================
-- PASO 7: Verificar cambios realizados
-- =====================================================

-- Verificar estructura actualizada de cat_roles
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME = 'cat_roles'
  AND COLUMN_NAME IN ('landing_route', 'priority', 'is_admin')
ORDER BY ORDINAL_POSITION;

-- Verificar estructura actualizada de users_roles
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME = 'users_roles'
  AND COLUMN_NAME = 'is_primary'
ORDER BY ORDINAL_POSITION;

-- Verificar datos actualizados en cat_roles
SELECT 
    id_rol,
    rol,
    landing_route,
    priority,
    is_admin,
    est_rol
FROM cat_roles
ORDER BY priority DESC, rol;

-- Verificar is_primary en users_roles
SELECT 
    ur.id_usuario,
    u.usuario,
    cr.rol,
    ur.is_primary,
    cr.priority,
    ur.est_usr_rol
FROM users_roles ur
LEFT JOIN sy_usuarios u ON ur.id_usuario = u.id_usuario
LEFT JOIN cat_roles cr ON ur.id_rol = cr.id_rol
WHERE ur.est_usr_rol = 'A'
ORDER BY ur.id_usuario, cr.priority DESC;

-- =====================================================
-- FIN DE MIGRATION 002
-- =====================================================
-- Próximos pasos:
-- 1. Ejecutar migration 004: Seed data (permisos iniciales)
-- 2. Ejecutar migration 005: Asignar permisos a roles
-- =====================================================
