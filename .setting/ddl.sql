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
