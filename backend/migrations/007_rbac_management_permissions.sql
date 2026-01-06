-- =====================================================
-- MIGRATION 007: RBAC 2.0 - Management Permissions
-- =====================================================
-- Descripción: Permisos para gestionar el propio sistema RBAC
-- Autor: SIRES Dev Team
-- Fecha: 2026-01-05
-- Versión: 1.0.0
--
-- IMPORTANTE:
-- 1. Este script agrega permisos para gestionar roles y permisos
-- 2. Permite CRUD completo del sistema RBAC
-- 3. Ejecutar DESPUÉS de migration 006 (cleanup_mysql_otp)
-- =====================================================

USE dbsisem;

-- =====================================================
-- PASO 1: Agregar columna is_system a cat_permissions
-- =====================================================

-- Esta columna marca permisos del sistema (protegidos de edición/eliminación)
ALTER TABLE cat_permissions
ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE
    COMMENT 'Permiso del sistema (no editable/eliminable por usuarios)';

-- Marcar todos los permisos existentes como is_system = TRUE
-- (son permisos base del sistema creados en migraciones anteriores)
UPDATE cat_permissions
SET is_system = TRUE
WHERE usr_alta = 'system';

-- =====================================================
-- PASO 2: Insertar permisos de gestión RBAC
-- =====================================================

-- ========== CATEGORÍA: SISTEMA - ROLES ==========
INSERT INTO cat_permissions (code, resource, action, description, category, is_system, usr_alta) VALUES
('roles:create', 'roles', 'create', 'Crear nuevos roles', 'SISTEMA', TRUE, 'system'),
('roles:read', 'roles', 'read', 'Ver roles del sistema', 'SISTEMA', TRUE, 'system'),
('roles:update', 'roles', 'update', 'Modificar roles existentes', 'SISTEMA', TRUE, 'system'),
('roles:delete', 'roles', 'delete', 'Eliminar roles', 'SISTEMA', TRUE, 'system');

-- ========== CATEGORÍA: SISTEMA - PERMISOS ==========
INSERT INTO cat_permissions (code, resource, action, description, category, is_system, usr_alta) VALUES
('permisos:create', 'permisos', 'create', 'Crear nuevos permisos', 'SISTEMA', TRUE, 'system'),
('permisos:read', 'permisos', 'read', 'Ver permisos del sistema', 'SISTEMA', TRUE, 'system'),
('permisos:update', 'permisos', 'update', 'Modificar permisos existentes', 'SISTEMA', TRUE, 'system'),
('permisos:delete', 'permisos', 'delete', 'Eliminar permisos', 'SISTEMA', TRUE, 'system'),
('permisos:assign', 'permisos', 'assign', 'Asignar permisos a roles y usuarios', 'SISTEMA', TRUE, 'system');

-- =====================================================
-- PASO 3: Asignar permisos al rol Admin
-- =====================================================

-- Obtener id_permission de los nuevos permisos y asignarlos al rol Admin (id_rol = 1)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 1, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'roles:create',
    'roles:read',
    'roles:update',
    'roles:delete',
    'permisos:create',
    'permisos:read',
    'permisos:update',
    'permisos:delete',
    'permisos:assign'
)
AND NOT EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    WHERE rp.id_rol = 1 
    AND rp.id_permission = cat_permissions.id_permission
);

-- =====================================================
-- PASO 4: Verificar permisos insertados
-- =====================================================

-- Ver permisos de gestión RBAC
SELECT 
    id_permission,
    code,
    description,
    category,
    is_system
FROM cat_permissions
WHERE resource IN ('roles', 'permisos')
ORDER BY resource, action;

-- Verificar asignación al rol Admin
SELECT 
    r.nombre as rol,
    p.code as permiso,
    p.description as descripcion
FROM role_permissions rp
INNER JOIN cat_roles r ON rp.id_rol = r.id_rol
INNER JOIN cat_permissions p ON rp.id_permission = p.id_permission
WHERE r.id_rol = 1
AND p.resource IN ('roles', 'permisos')
ORDER BY p.resource, p.action;

-- Contar permisos de gestión RBAC
SELECT 
    resource,
    COUNT(*) as total_permisos
FROM cat_permissions
WHERE resource IN ('roles', 'permisos')
GROUP BY resource;

-- =====================================================
-- PASO 4: Validación final
-- =====================================================

-- Validar que todos los permisos se crearon correctamente
-- Debería retornar 9 filas (4 roles + 5 permisos)
SELECT COUNT(*) as total_permisos_rbac
FROM cat_permissions
WHERE resource IN ('roles', 'permisos');

-- Validar que el Admin tiene todos los permisos RBAC
-- Debería retornar 9 filas
SELECT COUNT(*) as permisos_asignados_admin
FROM role_permissions rp
INNER JOIN cat_permissions p ON rp.id_permission = p.id_permission
WHERE rp.id_rol = 1
AND p.resource IN ('roles', 'permisos');

-- =====================================================
-- PASO 5: Validación final
-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Estos permisos son is_system = TRUE (protegidos de edición/eliminación)
-- 2. Solo el rol Admin tiene estos permisos por defecto
-- 3. Otros roles pueden recibir estos permisos según necesidad
-- 4. Los permisos de 'usuarios:assign_roles' y 'usuarios:assign_permissions' 
--    ya existen en migration 003 y son complementarios

-- =====================================================
-- FIN DE MIGRATION 007
-- =====================================================
-- Próximos pasos:
-- 1. Implementar endpoints CRUD para roles
-- 2. Implementar endpoints CRUD para permisos
-- 3. Implementar gestión multi-rol de usuarios
-- =====================================================
