-- =====================================================
-- MIGRATION 009: RBAC Fixes - Correcciones de Diseño
-- =====================================================
-- Fecha: 2026-01-08
-- Issues resueltos: CRIT-01, CRIT-07, HIGH-09, CRIT-06
-- =====================================================

USE dbsisem;

-- =====================================================
-- PASO 1: Agregar campo is_system a cat_roles (CRIT-01)
-- =====================================================
-- Evita el hardcoding de id_rol <= 22

ALTER TABLE cat_roles 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT FALSE
COMMENT 'TRUE = rol del sistema (protegido), FALSE = rol custom (editable)';

-- Marcar roles existentes del sistema (los que eran <= 22)
UPDATE cat_roles 
SET is_system = TRUE 
WHERE id_rol <= 22;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_cat_roles_is_system ON cat_roles(is_system);

-- =====================================================
-- PASO 2: Consolidar tablas de overrides (CRIT-07)
-- =====================================================
-- Problema: Existen dos tablas para lo mismo:
--   - user_permissions (migración 001)
--   - user_permission_overrides (migración 008)
--
-- Solución: Migrar datos a user_permission_overrides y deprecar user_permissions

-- 2.1 Verificar si user_permissions existe antes de migrar
SET @table_exists = (SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = 'dbsisem' 
    AND TABLE_NAME = 'user_permissions');

-- 2.2 Migrar datos solo si la tabla existe
SET @migrate_query = IF(@table_exists > 0,
    'INSERT IGNORE INTO user_permission_overrides 
        (id_usuario, id_permission, effect, expires_at, usr_alta, fch_alta)
    SELECT 
        id_usuario, 
        id_permission, 
        effect, 
        expires_at, 
        usr_alta, 
        fch_alta
    FROM user_permissions
    WHERE fch_baja IS NULL
    ON DUPLICATE KEY UPDATE
        effect = VALUES(effect),
        expires_at = VALUES(expires_at)',
    'SELECT "user_permissions no existe, saltando migración" AS status'
);

PREPARE migrate_stmt FROM @migrate_query;
EXECUTE migrate_stmt;
DEALLOCATE PREPARE migrate_stmt;

-- 2.3 Renombrar tabla vieja (no eliminar por si hay rollback necesario)
SET @rename_query = IF(@table_exists > 0,
    'RENAME TABLE user_permissions TO user_permissions_deprecated_20260108',
    'SELECT "user_permissions no existe, saltando rename" AS status'
);

PREPARE rename_stmt FROM @rename_query;
EXECUTE rename_stmt;
DEALLOCATE PREPARE rename_stmt;

-- =====================================================
-- PASO 3: Agregar índice para is_primary (HIGH-09)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_roles_primary 
ON users_roles(id_usuario, is_primary);

-- =====================================================
-- PASO 4: Agregar permiso sistema:cache (CRIT-06)
-- =====================================================

INSERT INTO cat_permissions 
(code, resource, action, description, category, is_system, usr_alta, est_permission)
VALUES 
('sistema:cache', 'sistema', 'cache', 'Invalidar cache de permisos', 'SISTEMA', TRUE, 'migration', 'A')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Asignar permiso sistema:cache al rol ADMINISTRADOR (asumiendo id_rol = 1)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta, fch_alta)
SELECT 1, id_permission, 'migration', NOW()
FROM cat_permissions
WHERE code = 'sistema:cache'
ON DUPLICATE KEY UPDATE usr_alta = VALUES(usr_alta);

-- =====================================================
-- PASO 5: Verificación
-- =====================================================

SELECT 'cat_roles.is_system agregado' as status, COUNT(*) as system_roles 
FROM cat_roles WHERE is_system = TRUE;

SELECT 'user_permission_overrides tiene' as status, COUNT(*) as overrides 
FROM user_permission_overrides WHERE fch_baja IS NULL;

SELECT 'Índice is_primary creado' as status;

SELECT 'Permiso sistema:cache creado' as status, COUNT(*) as count
FROM cat_permissions WHERE code = 'sistema:cache';

-- =====================================================
-- FIN DE MIGRATION 009
-- =====================================================
