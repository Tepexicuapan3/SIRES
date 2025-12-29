-- =====================================================
-- MIGRATION 004: RBAC 2.0 - Assign Permissions to Roles
-- =====================================================
-- Descripción: Asignación de permisos a roles existentes
-- Autor: SIRES Dev Team
-- Fecha: 2025-12-29
-- Versión: 1.0.0
--
-- IMPORTANTE:
-- 1. Este script asigna permisos a roles existentes
-- 2. Ejecutar DESPUÉS de migration 003
-- 3. Los permisos se asignan según las necesidades típicas de cada rol
-- =====================================================

USE SIRES;

-- =====================================================
-- PASO 1: Limpiar asignaciones previas (solo en desarrollo)
-- =====================================================
-- ADVERTENCIA: Descomentar solo si necesitas resetear

-- DELETE FROM role_permissions;

-- =====================================================
-- PASO 2: Asignar permisos al rol ADMINISTRADOR (id_rol=22)
-- =====================================================
-- El ADMINISTRADOR tiene is_admin=1, por lo que tiene acceso a TODO
-- Pero vamos a documentar sus permisos explícitos para auditoría

-- NOTA: En el código, is_admin=1 ya da bypass completo
-- Esta asignación es solo para documentación/auditoría

INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 
    22 as id_rol,
    id_permission,
    'system' as usr_alta
FROM cat_permissions
WHERE est_permission = 'A';

-- =====================================================
-- PASO 3: Asignar permisos al rol MEDICOS (id_rol=1)
-- =====================================================

-- Permisos de expedientes (read, update, search, print)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 1, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:read',
    'expedientes:update',
    'expedientes:search',
    'expedientes:print'
);

-- Permisos de consultas (create, read, update, sign, export)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 1, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'consultas:create',
    'consultas:read',
    'consultas:update',
    'consultas:sign',
    'consultas:export'
);

-- Permisos de recetas (create, read, print)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 1, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'recetas:create',
    'recetas:read',
    'recetas:print'
);

-- Permisos de citas (read)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 1, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'citas:read'
);

-- Permisos de laboratorio
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 1, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'laboratorio:create',
    'laboratorio:read',
    'laboratorio:print'
);

-- =====================================================
-- PASO 4: Asignar permisos al rol RECEPCION (id_rol=2)
-- =====================================================

-- Permisos de expedientes (create, read, search)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 2, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:create',
    'expedientes:read',
    'expedientes:search'
);

-- Permisos de citas (create, read, update, delete, confirm, reschedule)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 2, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'citas:create',
    'citas:read',
    'citas:update',
    'citas:delete',
    'citas:confirm',
    'citas:reschedule',
    'citas:export'
);

-- =====================================================
-- PASO 5: Asignar permisos al rol ESPECIALISTAS (id_rol=3)
-- =====================================================

-- Similar a MEDICOS pero con permisos adicionales
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 3, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:read',
    'expedientes:update',
    'expedientes:search',
    'expedientes:print',
    'consultas:create',
    'consultas:read',
    'consultas:update',
    'consultas:sign',
    'consultas:export',
    'consultas:read_others', -- Adicional para especialistas
    'recetas:create',
    'recetas:read',
    'recetas:print',
    'citas:read',
    'laboratorio:create',
    'laboratorio:read',
    'laboratorio:print'
);

-- =====================================================
-- PASO 6: Asignar permisos al rol FARMACIA (id_rol=7)
-- =====================================================

-- Permisos de recetas
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 7, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'recetas:read',
    'recetas:print'
);

-- Permisos de medicamentos
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 7, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'medicamentos:dispense',
    'medicamentos:read',
    'medicamentos:update_stock'
);

-- Permisos de expedientes (solo read)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 7, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:read',
    'expedientes:search'
);

-- =====================================================
-- PASO 7: Asignar permisos al rol JEFATURA CLINICA (id_rol=4)
-- =====================================================

-- Todos los permisos de médicos + reportes + consultas de otros
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 4, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:read',
    'expedientes:update',
    'expedientes:search',
    'expedientes:print',
    'expedientes:export',
    'consultas:create',
    'consultas:read',
    'consultas:update',
    'consultas:sign',
    'consultas:export',
    'consultas:read_others',
    'recetas:create',
    'recetas:read',
    'recetas:print',
    'citas:read',
    'laboratorio:create',
    'laboratorio:read',
    'laboratorio:print',
    'reportes:consultas',
    'reportes:citas',
    'reportes:export'
);

-- =====================================================
-- PASO 8: Asignar permisos al rol GERENCIA (id_rol=5)
-- =====================================================

-- Permisos de reportes y auditoría
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 5, id_permission, 'system'
FROM cat_permissions
WHERE code LIKE 'reportes:%' OR code LIKE 'sistema:audit' OR code IN (
    'expedientes:read',
    'expedientes:search',
    'expedientes:export',
    'consultas:read',
    'consultas:export',
    'usuarios:read'
);

-- =====================================================
-- PASO 9: Asignar permisos al rol URGENCIAS (id_rol=6)
-- =====================================================

INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 6, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:read',
    'expedientes:update',
    'expedientes:search',
    'urgencias:create',
    'urgencias:read',
    'urgencias:update',
    'urgencias:triage',
    'consultas:create',
    'consultas:read',
    'consultas:update',
    'consultas:sign',
    'recetas:create',
    'recetas:read',
    'laboratorio:create',
    'laboratorio:read'
);

-- =====================================================
-- PASO 10: Asignar permisos al rol TRANS-RECETA (id_rol=11)
-- =====================================================

INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 11, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'recetas:transcribe',
    'recetas:read',
    'recetas:print',
    'expedientes:read',
    'expedientes:search'
);

-- =====================================================
-- PASO 11: Asignar permisos a roles de HOSPITAL
-- =====================================================

-- HOSP-RECEPCION (id_rol=12)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 12, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:create',
    'expedientes:read',
    'expedientes:search',
    'citas:create',
    'citas:read',
    'citas:update',
    'hospital:admision'
);

-- HOSP-FACTURA (id_rol=13)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 13, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:read',
    'expedientes:search',
    'hospital:facturacion',
    'reportes:farmacia'
);

-- HOSP-MEDICO (id_rol=14)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 14, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:read',
    'expedientes:update',
    'expedientes:search',
    'consultas:create',
    'consultas:read',
    'consultas:update',
    'consultas:sign',
    'recetas:create',
    'recetas:read',
    'laboratorio:create',
    'laboratorio:read',
    'hospital:egreso'
);

-- HOSP-COORDINACION (id_rol=15)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 15, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:read',
    'expedientes:search',
    'consultas:read',
    'hospital:coordinacion',
    'reportes:consultas',
    'reportes:citas'
);

-- HOSP-TRABAJO SOCIAL (id_rol=16)
INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 16, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:read',
    'expedientes:search',
    'hospital:trabajo_social'
);

-- =====================================================
-- PASO 12: Asignar permisos al rol LICENCIA Y SM21 (id_rol=9)
-- =====================================================

INSERT INTO role_permissions (id_rol, id_permission, usr_alta)
SELECT 9, id_permission, 'system'
FROM cat_permissions
WHERE code IN (
    'expedientes:read',
    'expedientes:search',
    'consultas:read',
    'licencias:create',
    'licencias:read',
    'licencias:update',
    'licencias:print'
);

-- =====================================================
-- PASO 13: Verificar asignaciones realizadas
-- =====================================================

-- Ver total de permisos por rol
SELECT 
    cr.id_rol,
    cr.rol,
    cr.tp_rol,
    COUNT(rp.id_permission) as total_permisos,
    cr.is_admin
FROM cat_roles cr
LEFT JOIN role_permissions rp ON cr.id_rol = rp.id_rol AND rp.est_role_perm = 'A'
WHERE cr.est_rol = 'A'
GROUP BY cr.id_rol, cr.rol, cr.tp_rol, cr.is_admin
ORDER BY cr.priority DESC;

-- Ver permisos de un rol específico (ejemplo: MEDICOS)
SELECT 
    cr.rol,
    cp.category,
    cp.code,
    cp.description
FROM role_permissions rp
INNER JOIN cat_roles cr ON rp.id_rol = cr.id_rol
INNER JOIN cat_permissions cp ON rp.id_permission = cp.id_permission
WHERE cr.rol = 'MEDICOS'
  AND rp.est_role_perm = 'A'
  AND cp.est_permission = 'A'
ORDER BY cp.category, cp.code;

-- =====================================================
-- FIN DE MIGRATION 004
-- =====================================================
-- Próximos pasos:
-- 1. Ejecutar script de verificación (005_rbac_verification.sql)
-- 2. Crear repositorio de permisos en backend
-- =====================================================
