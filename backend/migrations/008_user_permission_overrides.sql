-- Migration 008: User Permission Overrides
-- Crea la tabla para gestionar permisos específicos por usuario (ALLOW/DENY)
-- Fecha: 2026-01-06
-- Fase: RBAC CRUD (Fase 4)

USE dbsisem;

-- Crear tabla user_permission_overrides
CREATE TABLE IF NOT EXISTS user_permission_overrides (
    id_user_permission_override INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT UNSIGNED NOT NULL,
    id_permission INT UNSIGNED NOT NULL,
    effect ENUM('ALLOW', 'DENY') NOT NULL DEFAULT 'ALLOW',
    expires_at DATETIME NULL,  -- NULL = sin expiración
    usr_alta VARCHAR(50),
    fch_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    usr_baja VARCHAR(50),
    fch_baja DATETIME NULL,    -- NULL = activo, NOT NULL = eliminado
    
    -- Constraints
    UNIQUE KEY unique_user_permission (id_usuario, id_permission),
    FOREIGN KEY (id_usuario) REFERENCES sy_usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_permission) REFERENCES cat_permissions(id_permission) ON DELETE CASCADE,
    
    -- Indices
    INDEX idx_user_active (id_usuario, fch_baja),
    INDEX idx_effect (effect),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios
ALTER TABLE user_permission_overrides 
COMMENT = 'Overrides de permisos por usuario (ALLOW/DENY). DENY > ALLOW > ROLE permissions.';
