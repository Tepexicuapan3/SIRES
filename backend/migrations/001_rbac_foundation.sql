-- =====================================================
-- MIGRATION 001: RBAC 2.0 - Foundation Tables
-- =====================================================
-- Descripción: Creación del sistema de permisos atómicos para SIRES
-- Autor: SIRES Dev Team
-- Fecha: 2025-12-29
-- Versión: 1.0.0
--
-- IMPORTANTE:
-- 1. Este script CREA nuevas tablas, NO modifica las existentes
-- 2. Ejecutar en orden secuencial
-- 3. Se recomienda hacer backup antes de ejecutar
-- 4. Compatible con MySQL 8.0+
-- =====================================================

USE SIRES;

-- =====================================================
-- PASO 1: Verificar que no existan las tablas
-- =====================================================
-- Si alguna de estas tablas existe, DETENER y revisar

-- DROP TABLE IF EXISTS user_permissions;
-- DROP TABLE IF EXISTS role_permissions;
-- DROP TABLE IF EXISTS cat_permissions;

-- =====================================================
-- PASO 2: Crear tabla de catálogo de permisos
-- =====================================================

CREATE TABLE IF NOT EXISTS cat_permissions (
    -- Identificador único
    id_permission INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Código del permiso (formato: "recurso:accion")
    code VARCHAR(50) NOT NULL UNIQUE 
        COMMENT 'Código único del permiso: "expedientes:create", "usuarios:delete"',
    
    -- Recurso al que aplica (entidad)
    resource VARCHAR(50) NOT NULL 
        COMMENT 'Recurso/entidad: expedientes, usuarios, citas, consultas, etc.',
    
    -- Acción sobre el recurso
    action VARCHAR(20) NOT NULL 
        COMMENT 'Acción: create, read, update, delete, export, assign, etc.',
    
    -- Descripción legible para humanos
    description VARCHAR(200) NOT NULL 
        COMMENT 'Descripción del permiso para mostrar en UI',
    
    -- Categoría para agrupar en UI
    category VARCHAR(50) NOT NULL 
        COMMENT 'Categoría de agrupación: EXPEDIENTES, USUARIOS, CITAS, CONSULTAS, FARMACIA, SISTEMA',
    
    -- Estado del permiso
    est_permission CHAR(1) NOT NULL DEFAULT 'A' 
        COMMENT 'Estado: A=Activo, I=Inactivo',
    
    -- Auditoría: Alta
    usr_alta VARCHAR(20) NOT NULL DEFAULT 'system' 
        COMMENT 'Usuario que creó el permiso',
    fch_alta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
        COMMENT 'Fecha de creación',
    
    -- Auditoría: Modificación
    usr_modf VARCHAR(20) DEFAULT NULL 
        COMMENT 'Usuario que modificó el permiso',
    fch_modf DATETIME DEFAULT NULL 
        COMMENT 'Fecha de modificación',
    
    -- Auditoría: Baja
    usr_baja VARCHAR(20) DEFAULT NULL 
        COMMENT 'Usuario que dio de baja el permiso',
    fch_baja DATETIME DEFAULT NULL 
        COMMENT 'Fecha de baja',
    
    -- Índices para performance
    INDEX idx_resource (resource),
    INDEX idx_category (category),
    INDEX idx_code (code),
    INDEX idx_estado (est_permission)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Catálogo de permisos atómicos del sistema RBAC 2.0';

-- =====================================================
-- PASO 3: Crear tabla de permisos por rol
-- =====================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    -- Identificador único
    id_role_perm INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Relación con rol
    id_rol INT UNSIGNED NOT NULL 
        COMMENT 'FK a cat_roles',
    
    -- Relación con permiso
    id_permission INT UNSIGNED NOT NULL 
        COMMENT 'FK a cat_permissions',
    
    -- Estado de la asignación
    est_role_perm CHAR(1) NOT NULL DEFAULT 'A' 
        COMMENT 'Estado: A=Activo, I=Inactivo',
    
    -- Auditoría: Alta
    usr_alta VARCHAR(20) NOT NULL DEFAULT 'system' 
        COMMENT 'Usuario que asignó el permiso al rol',
    fch_alta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
        COMMENT 'Fecha de asignación',
    
    -- Auditoría: Modificación
    usr_modf VARCHAR(20) DEFAULT NULL 
        COMMENT 'Usuario que modificó',
    fch_modf DATETIME DEFAULT NULL 
        COMMENT 'Fecha de modificación',
    
    -- Auditoría: Baja
    usr_baja VARCHAR(20) DEFAULT NULL 
        COMMENT 'Usuario que dio de baja',
    fch_baja DATETIME DEFAULT NULL 
        COMMENT 'Fecha de baja',
    
    -- Constraints
    UNIQUE KEY uq_rol_permission (id_rol, id_permission) 
        COMMENT 'Un rol no puede tener el mismo permiso duplicado',
    
    CONSTRAINT fk_roleperm_rol 
        FOREIGN KEY (id_rol) REFERENCES cat_roles(id_rol) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_roleperm_perm 
        FOREIGN KEY (id_permission) REFERENCES cat_permissions(id_permission) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Índices para performance
    INDEX idx_rol (id_rol),
    INDEX idx_permission (id_permission),
    INDEX idx_estado (est_role_perm)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Asignación de permisos a roles';

-- =====================================================
-- PASO 4: Crear tabla de overrides de permisos por usuario
-- =====================================================

CREATE TABLE IF NOT EXISTS user_permissions (
    -- Identificador único
    id_user_perm INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Relación con usuario
    id_usuario INT UNSIGNED NOT NULL 
        COMMENT 'FK a sy_usuarios',
    
    -- Relación con permiso
    id_permission INT UNSIGNED NOT NULL 
        COMMENT 'FK a cat_permissions',
    
    -- Efecto del override (ALLOW o DENY)
    effect ENUM('ALLOW', 'DENY') NOT NULL 
        COMMENT 'ALLOW: agregar permiso no incluido en rol. DENY: quitar permiso que sí tiene el rol. DENY tiene prioridad.',
    
    -- Justificación del override
    reason VARCHAR(200) DEFAULT NULL 
        COMMENT 'Razón por la cual se otorgó/quitó este permiso específico',
    
    -- Expiración del permiso (opcional)
    expires_at DATETIME DEFAULT NULL 
        COMMENT 'Fecha de expiración del permiso. NULL = permanente',
    
    -- Estado del override
    est_user_perm CHAR(1) NOT NULL DEFAULT 'A' 
        COMMENT 'Estado: A=Activo, I=Inactivo',
    
    -- Auditoría: Alta
    usr_alta VARCHAR(20) NOT NULL 
        COMMENT 'Usuario que creó el override',
    fch_alta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
        COMMENT 'Fecha de creación',
    
    -- Auditoría: Modificación
    usr_modf VARCHAR(20) DEFAULT NULL 
        COMMENT 'Usuario que modificó',
    fch_modf DATETIME DEFAULT NULL 
        COMMENT 'Fecha de modificación',
    
    -- Auditoría: Baja
    usr_baja VARCHAR(20) DEFAULT NULL 
        COMMENT 'Usuario que dio de baja',
    fch_baja DATETIME DEFAULT NULL 
        COMMENT 'Fecha de baja',
    
    -- Constraints
    UNIQUE KEY uq_user_permission (id_usuario, id_permission) 
        COMMENT 'Un usuario no puede tener el mismo permiso duplicado',
    
    CONSTRAINT fk_userperm_usuario 
        FOREIGN KEY (id_usuario) REFERENCES sy_usuarios(id_usuario) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_userperm_perm 
        FOREIGN KEY (id_permission) REFERENCES cat_permissions(id_permission) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Índices para performance
    INDEX idx_usuario (id_usuario),
    INDEX idx_permission (id_permission),
    INDEX idx_effect (effect),
    INDEX idx_expires (expires_at),
    INDEX idx_estado (est_user_perm)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Overrides de permisos por usuario (ALLOW/DENY tienen prioridad sobre roles)';

-- =====================================================
-- PASO 5: Verificación de creación exitosa
-- =====================================================

-- Verificar que las 3 tablas se crearon correctamente
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'SIRES'
  AND TABLE_NAME IN ('cat_permissions', 'role_permissions', 'user_permissions')
ORDER BY TABLE_NAME;

-- =====================================================
-- FIN DE MIGRATION 001
-- =====================================================
-- Próximos pasos:
-- 1. Ejecutar migration 002: ALTER cat_roles (agregar landing_route, priority, is_admin)
-- 2. Ejecutar migration 003: ALTER users_roles (agregar is_primary)
-- 3. Ejecutar migration 004: Seed data (permisos iniciales)
-- =====================================================
