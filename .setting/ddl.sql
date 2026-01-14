<<<<<<< Updated upstream
# 2026-01-08 20:04:26
ALTER TABLE cat_roles 
ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE
COMMENT 'TRUE = rol del sistema (protegido), FALSE = rol custom (editable)';
# 2026-01-08 20:04:35
CREATE INDEX idx_cat_roles_is_system ON cat_roles(is_system);
# 2026-01-08 20:04:43
RENAME TABLE user_permissions TO user_permissions_deprecated_20260108;
# 2026-01-08 20:04:48
CREATE INDEX idx_users_roles_primary ON users_roles(id_usuario, is_primary);
=======
# 2026-01-06 20:36:47
ALTER TABLE cat_permissions
ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE
    COMMENT 'Permiso del sistema (no editable/eliminable por usuarios)';
# 2026-01-06 21:40:25
CREATE TABLE IF NOT EXISTS user_permission_overrides (
    id_user_permission_override INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT UNSIGNED NOT NULL,
    id_permission INT UNSIGNED NOT NULL,
    effect ENUM('ALLOW', 'DENY') NOT NULL DEFAULT 'ALLOW',
    expires_at DATETIME NULL,
    usr_alta VARCHAR(50),
    fch_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    usr_baja VARCHAR(50),
    fch_baja DATETIME NULL,
    
    UNIQUE KEY unique_user_permission (id_usuario, id_permission),
    FOREIGN KEY (id_usuario) REFERENCES sy_usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_permission) REFERENCES cat_permissions(id_permission) ON DELETE CASCADE,
    
    INDEX idx_user_active (id_usuario, fch_baja),
    INDEX idx_effect (effect),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
>>>>>>> Stashed changes
