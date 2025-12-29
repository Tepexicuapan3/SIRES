-- =====================================================
-- VERIFICATION SCRIPT: RBAC 2.0 Post-Migration
-- =====================================================
-- Descripción: Verificación completa del sistema RBAC 2.0
-- Autor: SIRES Dev Team
-- Fecha: 2025-12-29
-- Versión: 1.0.0
--
-- IMPORTANTE:
-- 1. Ejecutar DESPUÉS de todas las migraciones (001-004)
-- 2. Este script NO modifica datos, solo consulta
-- 3. Revisar que todos los tests pasen
-- =====================================================

USE SIRES;

-- =====================================================
-- TEST 1: Verificar que las tablas existen
-- =====================================================

SELECT '========== TEST 1: Verificar Tablas ==========' as test;

SELECT 
    TABLE_NAME,
    TABLE_ROWS as rows_aprox,
    CREATE_TIME,
    TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME IN (
    'cat_permissions',
    'role_permissions',
    'user_permissions',
    'cat_roles',
    'users_roles'
  )
ORDER BY TABLE_NAME;

-- =====================================================
-- TEST 2: Verificar campos nuevos en cat_roles
-- =====================================================

SELECT '========== TEST 2: Nuevos Campos cat_roles ==========' as test;

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

-- =====================================================
-- TEST 3: Verificar campo is_primary en users_roles
-- =====================================================

SELECT '========== TEST 3: Campo is_primary en users_roles ==========' as test;

SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME = 'users_roles'
  AND COLUMN_NAME = 'is_primary';

-- =====================================================
-- TEST 4: Verificar permisos insertados
-- =====================================================

SELECT '========== TEST 4: Total de Permisos por Categoría ==========' as test;

SELECT 
    category,
    COUNT(*) as total_permisos,
    SUM(CASE WHEN est_permission = 'A' THEN 1 ELSE 0 END) as activos
FROM cat_permissions
GROUP BY category
ORDER BY category;

-- Total esperado: ~70-80 permisos
SELECT 
    COUNT(*) as total_permisos_sistema,
    SUM(CASE WHEN est_permission = 'A' THEN 1 ELSE 0 END) as activos
FROM cat_permissions;

-- =====================================================
-- TEST 5: Verificar asignaciones a roles
-- =====================================================

SELECT '========== TEST 5: Permisos Asignados por Rol ==========' as test;

SELECT 
    cr.id_rol,
    cr.rol,
    cr.tp_rol,
    cr.is_admin,
    COUNT(rp.id_permission) as permisos_asignados,
    cr.landing_route,
    cr.priority
FROM cat_roles cr
LEFT JOIN role_permissions rp ON cr.id_rol = rp.id_rol AND rp.est_role_perm = 'A'
WHERE cr.est_rol = 'A'
GROUP BY cr.id_rol, cr.rol, cr.tp_rol, cr.is_admin, cr.landing_route, cr.priority
ORDER BY cr.priority DESC;

-- =====================================================
-- TEST 6: Verificar roles principales de usuarios
-- =====================================================

SELECT '========== TEST 6: Roles Principales de Usuarios ==========' as test;

SELECT 
    u.id_usuario,
    u.usuario,
    COUNT(ur.id_rol) as total_roles,
    SUM(CASE WHEN ur.is_primary = 1 THEN 1 ELSE 0 END) as roles_primary,
    GROUP_CONCAT(
        CONCAT(r.rol, IF(ur.is_primary = 1, ' [PRIMARY]', ''))
        ORDER BY r.priority DESC
        SEPARATOR ' | '
    ) as roles
FROM sy_usuarios u
INNER JOIN users_roles ur ON u.id_usuario = ur.id_usuario
INNER JOIN cat_roles r ON ur.id_rol = r.id_rol
WHERE u.est_usuario = 'A' AND ur.est_usr_rol = 'A'
GROUP BY u.id_usuario, u.usuario
ORDER BY u.id_usuario;

-- REGLA: Cada usuario debe tener exactamente 1 rol marcado como primary
-- Esto debe retornar 0 filas
SELECT '========== TEST 6b: Usuarios con is_primary incorrecto ==========' as test;

SELECT 
    u.id_usuario,
    u.usuario,
    SUM(CASE WHEN ur.is_primary = 1 THEN 1 ELSE 0 END) as roles_primary,
    'ERROR: Debe tener exactamente 1 rol primary' as error_msg
FROM sy_usuarios u
INNER JOIN users_roles ur ON u.id_usuario = ur.id_usuario
WHERE u.est_usuario = 'A' AND ur.est_usr_rol = 'A'
GROUP BY u.id_usuario, u.usuario
HAVING roles_primary != 1;

-- =====================================================
-- TEST 7: Verificar integridad referencial
-- =====================================================

SELECT '========== TEST 7: Integridad Referencial ==========' as test;

-- Verificar FKs de role_permissions
SELECT 
    'role_permissions → cat_roles' as relacion,
    COUNT(*) as registros_huerfanos
FROM role_permissions rp
LEFT JOIN cat_roles cr ON rp.id_rol = cr.id_rol
WHERE cr.id_rol IS NULL;

SELECT 
    'role_permissions → cat_permissions' as relacion,
    COUNT(*) as registros_huerfanos
FROM role_permissions rp
LEFT JOIN cat_permissions cp ON rp.id_permission = cp.id_permission
WHERE cp.id_permission IS NULL;

-- Verificar FKs de user_permissions (debe ser 0 si no hay datos aún)
SELECT 
    'user_permissions → sy_usuarios' as relacion,
    COUNT(*) as registros_huerfanos
FROM user_permissions up
LEFT JOIN sy_usuarios u ON up.id_usuario = u.id_usuario
WHERE u.id_usuario IS NULL;

SELECT 
    'user_permissions → cat_permissions' as relacion,
    COUNT(*) as registros_huerfanos
FROM user_permissions up
LEFT JOIN cat_permissions cp ON up.id_permission = cp.id_permission
WHERE cp.id_permission IS NULL;

-- =====================================================
-- TEST 8: Verificar que ADMINISTRADOR tiene is_admin=1
-- =====================================================

SELECT '========== TEST 8: Rol ADMINISTRADOR ==========' as test;

SELECT 
    id_rol,
    rol,
    is_admin,
    priority,
    landing_route,
    CASE 
        WHEN is_admin = 1 THEN 'OK'
        ELSE 'ERROR: ADMINISTRADOR debe tener is_admin=1'
    END as status
FROM cat_roles
WHERE rol = 'ADMINISTRADOR';

-- =====================================================
-- TEST 9: Ejemplo de permisos efectivos de un usuario
-- =====================================================

SELECT '========== TEST 9: Permisos de Usuario de Ejemplo ==========' as test;

-- Asumiendo usuario 40488 (ADMINISTRADOR)
SELECT 
    u.usuario,
    cr.rol,
    cr.is_admin,
    CASE 
        WHEN cr.is_admin = 1 THEN 'ACCESO TOTAL (bypass)'
        ELSE CONCAT(COUNT(rp.id_permission), ' permisos explícitos')
    END as permisos_info
FROM sy_usuarios u
INNER JOIN users_roles ur ON u.id_usuario = ur.id_usuario
INNER JOIN cat_roles cr ON ur.id_rol = cr.id_rol
LEFT JOIN role_permissions rp ON cr.id_rol = rp.id_rol AND rp.est_role_perm = 'A'
WHERE u.usuario = '40488'
  AND ur.est_usr_rol = 'A'
GROUP BY u.usuario, cr.rol, cr.is_admin;

-- =====================================================
-- TEST 10: Permisos duplicados (no debería haber)
-- =====================================================

SELECT '========== TEST 10: Permisos Duplicados ==========' as test;

SELECT 
    id_rol,
    id_permission,
    COUNT(*) as duplicados
FROM role_permissions
WHERE est_role_perm = 'A'
GROUP BY id_rol, id_permission
HAVING duplicados > 1;

-- Debe retornar 0 filas. Si hay filas, hay duplicados.

-- =====================================================
-- TEST 11: Códigos de permisos inválidos (por convención)
-- =====================================================

SELECT '========== TEST 11: Validar Formato de Códigos ==========' as test;

-- Los códigos deben seguir formato: "resource:action"
SELECT 
    code,
    'ERROR: Formato debe ser resource:action' as error_msg
FROM cat_permissions
WHERE code NOT LIKE '%:%'
   OR LENGTH(code) - LENGTH(REPLACE(code, ':', '')) != 1;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================

SELECT '========== RESUMEN FINAL ==========' as test;

SELECT 
    'Tablas RBAC 2.0' as componente,
    COUNT(*) as total
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME IN ('cat_permissions', 'role_permissions', 'user_permissions')

UNION ALL

SELECT 
    'Permisos base sistema',
    COUNT(*)
FROM cat_permissions
WHERE est_permission = 'A'

UNION ALL

SELECT 
    'Roles activos',
    COUNT(*)
FROM cat_roles
WHERE est_rol = 'A'

UNION ALL

SELECT 
    'Asignaciones rol-permiso',
    COUNT(*)
FROM role_permissions
WHERE est_role_perm = 'A'

UNION ALL

SELECT 
    'Usuarios con roles',
    COUNT(DISTINCT id_usuario)
FROM users_roles
WHERE est_usr_rol = 'A'

UNION ALL

SELECT 
    'Overrides de usuario',
    COUNT(*)
FROM user_permissions
WHERE est_user_perm = 'A';

-- =====================================================
-- FIN DE VERIFICACIÓN
-- =====================================================
-- Si todos los tests pasan:
-- - Todas las tablas existen
-- - Los campos nuevos están presentes
-- - Los permisos están insertados
-- - Las asignaciones están correctas
-- - La integridad referencial es válida
--
-- Próximos pasos:
-- 1. Implementar PermissionRepository en backend
-- 2. Implementar AuthorizationService
-- 3. Modificar LoginUseCase para incluir permisos
-- =====================================================
