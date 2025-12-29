-- =====================================================
-- MIGRATION 003: RBAC 2.0 - Seed Initial Permissions
-- =====================================================
-- Descripción: Datos iniciales del catálogo de permisos
-- Autor: SIRES Dev Team
-- Fecha: 2025-12-29
-- Versión: 1.0.0
--
-- IMPORTANTE:
-- 1. Este script inserta datos iniciales en cat_permissions
-- 2. Define los permisos base del sistema SIRES
-- 3. Ejecutar DESPUÉS de migration 001 y 002
-- =====================================================

USE SIRES;

-- =====================================================
-- PASO 1: Limpiar datos previos (solo en desarrollo)
-- =====================================================
-- ADVERTENCIA: Descomentar solo si necesitas resetear permisos

-- DELETE FROM user_permissions;
-- DELETE FROM role_permissions;
-- DELETE FROM cat_permissions;

-- =====================================================
-- PASO 2: Insertar permisos base del sistema
-- =====================================================

-- ========== CATEGORÍA: EXPEDIENTES ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('expedientes:create', 'expedientes', 'create', 'Crear nuevos expedientes', 'EXPEDIENTES', 'system'),
('expedientes:read', 'expedientes', 'read', 'Ver expedientes', 'EXPEDIENTES', 'system'),
('expedientes:update', 'expedientes', 'update', 'Modificar expedientes', 'EXPEDIENTES', 'system'),
('expedientes:delete', 'expedientes', 'delete', 'Eliminar expedientes', 'EXPEDIENTES', 'system'),
('expedientes:export', 'expedientes', 'export', 'Exportar expedientes', 'EXPEDIENTES', 'system'),
('expedientes:search', 'expedientes', 'search', 'Buscar expedientes', 'EXPEDIENTES', 'system'),
('expedientes:print', 'expedientes', 'print', 'Imprimir expedientes', 'EXPEDIENTES', 'system');

-- ========== CATEGORÍA: USUARIOS ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('usuarios:create', 'usuarios', 'create', 'Crear usuarios', 'USUARIOS', 'system'),
('usuarios:read', 'usuarios', 'read', 'Ver usuarios', 'USUARIOS', 'system'),
('usuarios:update', 'usuarios', 'update', 'Modificar usuarios', 'USUARIOS', 'system'),
('usuarios:delete', 'usuarios', 'delete', 'Eliminar usuarios', 'USUARIOS', 'system'),
('usuarios:assign_roles', 'usuarios', 'assign_roles', 'Asignar roles a usuarios', 'USUARIOS', 'system'),
('usuarios:assign_permissions', 'usuarios', 'assign_permissions', 'Asignar permisos a usuarios', 'USUARIOS', 'system'),
('usuarios:reset_password', 'usuarios', 'reset_password', 'Resetear contraseñas', 'USUARIOS', 'system'),
('usuarios:lock', 'usuarios', 'lock', 'Bloquear/Desbloquear usuarios', 'USUARIOS', 'system');

-- ========== CATEGORÍA: CITAS ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('citas:create', 'citas', 'create', 'Agendar citas', 'CITAS', 'system'),
('citas:read', 'citas', 'read', 'Ver citas', 'CITAS', 'system'),
('citas:update', 'citas', 'update', 'Modificar citas', 'CITAS', 'system'),
('citas:delete', 'citas', 'delete', 'Cancelar citas', 'CITAS', 'system'),
('citas:confirm', 'citas', 'confirm', 'Confirmar citas', 'CITAS', 'system'),
('citas:reschedule', 'citas', 'reschedule', 'Reagendar citas', 'CITAS', 'system'),
('citas:export', 'citas', 'export', 'Exportar agenda', 'CITAS', 'system');

-- ========== CATEGORÍA: CONSULTAS MÉDICAS ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('consultas:create', 'consultas', 'create', 'Registrar consultas', 'CONSULTAS', 'system'),
('consultas:read', 'consultas', 'read', 'Ver historial de consultas', 'CONSULTAS', 'system'),
('consultas:update', 'consultas', 'update', 'Modificar consultas', 'CONSULTAS', 'system'),
('consultas:delete', 'consultas', 'delete', 'Eliminar consultas', 'CONSULTAS', 'system'),
('consultas:sign', 'consultas', 'sign', 'Firmar consultas', 'CONSULTAS', 'system'),
('consultas:export', 'consultas', 'export', 'Exportar historial clínico', 'CONSULTAS', 'system'),
('consultas:read_others', 'consultas', 'read_others', 'Ver consultas de otros médicos', 'CONSULTAS', 'system');

-- ========== CATEGORÍA: RECETAS ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('recetas:create', 'recetas', 'create', 'Crear recetas', 'FARMACIA', 'system'),
('recetas:read', 'recetas', 'read', 'Ver recetas', 'FARMACIA', 'system'),
('recetas:update', 'recetas', 'update', 'Modificar recetas', 'FARMACIA', 'system'),
('recetas:delete', 'recetas', 'delete', 'Anular recetas', 'FARMACIA', 'system'),
('recetas:transcribe', 'recetas', 'transcribe', 'Transcribir recetas', 'FARMACIA', 'system'),
('recetas:print', 'recetas', 'print', 'Imprimir recetas', 'FARMACIA', 'system');

-- ========== CATEGORÍA: MEDICAMENTOS ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('medicamentos:dispense', 'medicamentos', 'dispense', 'Dispensar medicamentos', 'FARMACIA', 'system'),
('medicamentos:read', 'medicamentos', 'read', 'Consultar inventario de medicamentos', 'FARMACIA', 'system'),
('medicamentos:update_stock', 'medicamentos', 'update_stock', 'Actualizar inventario', 'FARMACIA', 'system'),
('medicamentos:create', 'medicamentos', 'create', 'Registrar medicamentos', 'FARMACIA', 'system'),
('medicamentos:update', 'medicamentos', 'update', 'Modificar medicamentos', 'FARMACIA', 'system');

-- ========== CATEGORÍA: REPORTES ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('reportes:consultas', 'reportes', 'consultas', 'Generar reporte de consultas', 'REPORTES', 'system'),
('reportes:citas', 'reportes', 'citas', 'Generar reporte de citas', 'REPORTES', 'system'),
('reportes:farmacia', 'reportes', 'farmacia', 'Generar reporte de farmacia', 'REPORTES', 'system'),
('reportes:usuarios', 'reportes', 'usuarios', 'Generar reporte de usuarios', 'REPORTES', 'system'),
('reportes:expedientes', 'reportes', 'expedientes', 'Generar reporte de expedientes', 'REPORTES', 'system'),
('reportes:export', 'reportes', 'export', 'Exportar reportes', 'REPORTES', 'system'),
('reportes:advanced', 'reportes', 'advanced', 'Generar reportes avanzados', 'REPORTES', 'system');

-- ========== CATEGORÍA: LABORATORIO ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('laboratorio:create', 'laboratorio', 'create', 'Solicitar estudios de laboratorio', 'LABORATORIO', 'system'),
('laboratorio:read', 'laboratorio', 'read', 'Ver resultados de laboratorio', 'LABORATORIO', 'system'),
('laboratorio:update', 'laboratorio', 'update', 'Actualizar resultados', 'LABORATORIO', 'system'),
('laboratorio:print', 'laboratorio', 'print', 'Imprimir resultados', 'LABORATORIO', 'system');

-- ========== CATEGORÍA: PASES ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('pases:create', 'pases', 'create', 'Generar pases médicos', 'PASES', 'system'),
('pases:read', 'pases', 'read', 'Ver pases médicos', 'PASES', 'system'),
('pases:update', 'pases', 'update', 'Modificar pases', 'PASES', 'system'),
('pases:print', 'pases', 'print', 'Imprimir pases', 'PASES', 'system');

-- ========== CATEGORÍA: LICENCIAS ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('licencias:create', 'licencias', 'create', 'Emitir licencias médicas', 'LICENCIAS', 'system'),
('licencias:read', 'licencias', 'read', 'Ver licencias médicas', 'LICENCIAS', 'system'),
('licencias:update', 'licencias', 'update', 'Modificar licencias', 'LICENCIAS', 'system'),
('licencias:approve', 'licencias', 'approve', 'Aprobar licencias', 'LICENCIAS', 'system'),
('licencias:print', 'licencias', 'print', 'Imprimir licencias', 'LICENCIAS', 'system');

-- ========== CATEGORÍA: URGENCIAS ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('urgencias:create', 'urgencias', 'create', 'Registrar atención de urgencias', 'URGENCIAS', 'system'),
('urgencias:read', 'urgencias', 'read', 'Ver urgencias', 'URGENCIAS', 'system'),
('urgencias:update', 'urgencias', 'update', 'Modificar urgencias', 'URGENCIAS', 'system'),
('urgencias:triage', 'urgencias', 'triage', 'Realizar triage', 'URGENCIAS', 'system');

-- ========== CATEGORÍA: HOSPITAL ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('hospital:admision', 'hospital', 'admision', 'Admisión de pacientes', 'HOSPITAL', 'system'),
('hospital:egreso', 'hospital', 'egreso', 'Egreso de pacientes', 'HOSPITAL', 'system'),
('hospital:facturacion', 'hospital', 'facturacion', 'Facturación hospitalaria', 'HOSPITAL', 'system'),
('hospital:coordinacion', 'hospital', 'coordinacion', 'Coordinación hospitalaria', 'HOSPITAL', 'system'),
('hospital:trabajo_social', 'hospital', 'trabajo_social', 'Trabajo social', 'HOSPITAL', 'system');

-- ========== CATEGORÍA: CATÁLOGOS ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('catalogos:read', 'catalogos', 'read', 'Ver catálogos', 'CATALOGOS', 'system'),
('catalogos:create', 'catalogos', 'create', 'Crear registros en catálogos', 'CATALOGOS', 'system'),
('catalogos:update', 'catalogos', 'update', 'Modificar catálogos', 'CATALOGOS', 'system'),
('catalogos:delete', 'catalogos', 'delete', 'Eliminar registros de catálogos', 'CATALOGOS', 'system');

-- ========== CATEGORÍA: SISTEMA ==========
INSERT INTO cat_permissions (code, resource, action, description, category, usr_alta) VALUES
('sistema:config', 'sistema', 'config', 'Configurar sistema', 'SISTEMA', 'system'),
('sistema:audit', 'sistema', 'audit', 'Ver bitácora de auditoría', 'SISTEMA', 'system'),
('sistema:backup', 'sistema', 'backup', 'Realizar respaldos', 'SISTEMA', 'system'),
('sistema:maintenance', 'sistema', 'maintenance', 'Modo mantenimiento', 'SISTEMA', 'system'),
('sistema:logs', 'sistema', 'logs', 'Ver logs del sistema', 'SISTEMA', 'system');

-- =====================================================
-- PASO 3: Verificar permisos insertados
-- =====================================================

-- Ver resumen por categoría
SELECT 
    category,
    COUNT(*) as total_permisos
FROM cat_permissions
GROUP BY category
ORDER BY category;

-- Ver todos los permisos
SELECT 
    id_permission,
    code,
    description,
    category
FROM cat_permissions
ORDER BY category, resource, action;

-- Total de permisos creados
SELECT COUNT(*) as total_permisos FROM cat_permissions;

-- =====================================================
-- FIN DE MIGRATION 003
-- =====================================================
-- Próximos pasos:
-- 1. Ejecutar migration 004: Asignar permisos a roles existentes
-- =====================================================
