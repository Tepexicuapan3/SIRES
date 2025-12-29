-- =====================================================
-- ROLLBACK SCRIPT: RBAC 2.0 - Revertir Migraciones
-- =====================================================
-- Descripción: Revertir TODOS los cambios de RBAC 2.0
-- Autor: SIRES Dev Team
-- Fecha: 2025-12-29
-- Versión: 1.0.0
--
-- ⚠️⚠️⚠️ ADVERTENCIA CRÍTICA ⚠️⚠️⚠️
-- 1. Este script ELIMINA datos y columnas
-- 2. NO ES REVERSIBLE - los datos se pierden permanentemente
-- 3. SOLO ejecutar si las migraciones fallaron
-- 4. Asegúrate de tener BACKUP antes de ejecutar
-- 5. Este rollback NO recupera datos de user_permissions o role_permissions
-- =====================================================

USE SIRES;

-- =====================================================
-- CONFIRMACIÓN DE SEGURIDAD
-- =====================================================
-- Descomentar la siguiente línea SOLO si estás 100% seguro
-- SET @CONFIRMAR_ROLLBACK = 'SI_ESTOY_SEGURO';

-- Verificación de seguridad
SELECT 
    CASE 
        WHEN @CONFIRMAR_ROLLBACK = 'SI_ESTOY_SEGURO' THEN 'Procediendo con rollback...'
        ELSE 'ROLLBACK CANCELADO: Debes descomentar la línea de confirmación'
    END as status;

-- Si no se confirmó, detener ejecución
-- (esto no funciona en MySQL, es solo documentación)

-- =====================================================
-- PASO 1: ELIMINAR FOREIGN KEYS
-- =====================================================
-- Necesario antes de eliminar las tablas

SELECT 'PASO 1: Eliminando Foreign Keys...' as step;

-- FKs de role_permissions
ALTER TABLE role_permissions 
DROP FOREIGN KEY IF EXISTS fk_roleperm_rol;

ALTER TABLE role_permissions 
DROP FOREIGN KEY IF EXISTS fk_roleperm_perm;

-- FKs de user_permissions
ALTER TABLE user_permissions 
DROP FOREIGN KEY IF EXISTS fk_userperm_usuario;

ALTER TABLE user_permissions 
DROP FOREIGN KEY IF EXISTS fk_userperm_perm;

-- =====================================================
-- PASO 2: ELIMINAR TABLAS NUEVAS
-- =====================================================

SELECT 'PASO 2: Eliminando tablas nuevas...' as step;

-- Orden inverso a la creación (por dependencias)
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS cat_permissions;

-- =====================================================
-- PASO 3: ELIMINAR CAMPOS AGREGADOS A cat_roles
-- =====================================================

SELECT 'PASO 3: Eliminando campos de cat_roles...' as step;

-- Verificar si los campos existen antes de eliminar
SET @existe_landing_route = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'SIRES'
      AND TABLE_NAME = 'cat_roles'
      AND COLUMN_NAME = 'landing_route'
);

SET @existe_priority = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'SIRES'
      AND TABLE_NAME = 'cat_roles'
      AND COLUMN_NAME = 'priority'
);

SET @existe_is_admin = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'SIRES'
      AND TABLE_NAME = 'cat_roles'
      AND COLUMN_NAME = 'is_admin'
);

-- Eliminar campos si existen
SET @sql_drop_landing = IF(
    @existe_landing_route > 0,
    'ALTER TABLE cat_roles DROP COLUMN landing_route',
    'SELECT "landing_route no existe, skip" as info'
);
PREPARE stmt FROM @sql_drop_landing;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_drop_priority = IF(
    @existe_priority > 0,
    'ALTER TABLE cat_roles DROP COLUMN priority',
    'SELECT "priority no existe, skip" as info'
);
PREPARE stmt FROM @sql_drop_priority;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_drop_is_admin = IF(
    @existe_is_admin > 0,
    'ALTER TABLE cat_roles DROP COLUMN is_admin',
    'SELECT "is_admin no existe, skip" as info'
);
PREPARE stmt FROM @sql_drop_is_admin;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 4: ELIMINAR CAMPO AGREGADO A users_roles
-- =====================================================

SELECT 'PASO 4: Eliminando campo de users_roles...' as step;

SET @existe_is_primary = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'SIRES'
      AND TABLE_NAME = 'users_roles'
      AND COLUMN_NAME = 'is_primary'
);

SET @sql_drop_is_primary = IF(
    @existe_is_primary > 0,
    'ALTER TABLE users_roles DROP COLUMN is_primary',
    'SELECT "is_primary no existe, skip" as info'
);
PREPARE stmt FROM @sql_drop_is_primary;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 5: VERIFICAR ESTADO POST-ROLLBACK
-- =====================================================

SELECT 'PASO 5: Verificando rollback...' as step;

-- Verificar que las tablas se eliminaron
SELECT 
    TABLE_NAME,
    'ERROR: Esta tabla debería haberse eliminado' as status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME IN ('cat_permissions', 'role_permissions', 'user_permissions');

-- Si no retorna filas, las tablas se eliminaron correctamente

-- Verificar que los campos se eliminaron de cat_roles
SELECT 
    COLUMN_NAME,
    'ERROR: Esta columna debería haberse eliminado' as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME = 'cat_roles'
  AND COLUMN_NAME IN ('landing_route', 'priority', 'is_admin');

-- Si no retorna filas, los campos se eliminaron correctamente

-- Verificar que el campo se eliminó de users_roles
SELECT 
    COLUMN_NAME,
    'ERROR: Esta columna debería haberse eliminado' as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME = 'users_roles'
  AND COLUMN_NAME = 'is_primary';

-- Si no retorna filas, el campo se eliminó correctamente

-- =====================================================
-- RESUMEN DE ROLLBACK
-- =====================================================

SELECT 'ROLLBACK COMPLETADO' as resultado;

SELECT 
    'Tablas RBAC 2.0 eliminadas' as accion,
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK'
        ELSE CONCAT('ERROR: ', COUNT(*), ' tablas aún existen')
    END as estado
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME IN ('cat_permissions', 'role_permissions', 'user_permissions')

UNION ALL

SELECT 
    'Campos de cat_roles eliminados',
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK'
        ELSE CONCAT('ERROR: ', COUNT(*), ' campos aún existen')
    END
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME = 'cat_roles'
  AND COLUMN_NAME IN ('landing_route', 'priority', 'is_admin')

UNION ALL

SELECT 
    'Campo is_primary eliminado de users_roles',
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK'
        ELSE 'ERROR: Campo aún existe'
    END
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME = 'users_roles'
  AND COLUMN_NAME = 'is_primary';

-- =====================================================
-- ADVERTENCIAS POST-ROLLBACK
-- =====================================================

SELECT '
⚠️  ADVERTENCIAS POST-ROLLBACK:

1. Los datos de permisos se perdieron permanentemente
2. Los datos de asignaciones rol-permiso se perdieron
3. Los valores de landing_route/priority de roles se perdieron
4. Los valores de is_primary de users_roles se perdieron

5. Las tablas legacy (det_roles, det_roles_personalizados) NO se modificaron

6. Si tenías código que usa el nuevo sistema RBAC 2.0, FALLARÁ

7. Para volver a instalar RBAC 2.0, ejecuta las migraciones desde cero

' as advertencias;

-- =====================================================
-- FIN DE ROLLBACK
-- =====================================================
-- IMPORTANTE: Después del rollback, revisa tu código:
-- 1. Elimina imports de PermissionRepository (si los creaste)
-- 2. Elimina uso de decoradores @requires_permission
-- 3. Revierte cambios en LoginUseCase
-- 4. Revierte cambios en frontend (auth.types.ts, usePermissions, etc.)
-- =====================================================
