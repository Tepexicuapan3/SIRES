/**
 * Types for Permissions API
 *
 * Contracts for RBAC 2.0 permission management
 */

export interface Permission {
  id_permission: number;
  code: string;
  resource: string;
  action: string;
  description: string;
  category: string;
}

export interface Role {
  id_rol: number;
  cod_rol: string;
  nom_rol: string;
  landing_route: string;
  priority: number;
  is_admin: number; // 0 or 1
  permissions_count: number;
}

export interface PermissionCatalogResponse {
  permissions: Permission[];
}

export interface RolesListResponse {
  total: number;
  roles: Role[];
}

export interface RolePermissionsResponse {
  role_id: number;
  total: number;
  permissions: Permission[];
}

export interface AssignPermissionRequest {
  permission_id: number;
}

export interface RevokePermissionRequest {
  permission_id: number;
}

export interface AssignPermissionResponse {
  message: string;
  role_id: number;
  permission_id: number;
}

/**
 * Request payload for creating a new permission
 * POST /api/v1/permissions
 */
export interface CreatePermissionRequest {
  code: string; // Required: formato "resource:action"
  resource: string; // Required: parte antes de ":"
  action: string; // Required: parte después de ":"
  description: string; // Required
  category?: string; // Optional: default "OTROS"
}

/**
 * Request payload for updating a permission
 * PUT /api/v1/permissions/:id
 */
export interface UpdatePermissionRequest {
  description?: string; // Solo permite modificar descripción
  category?: string; // y categoría
  // code, resource, action son INMUTABLES
}

/**
 * Response from create/update permission
 */
export interface PermissionResponse {
  id_permission: number;
  code: string;
  resource: string;
  action: string;
  description: string;
  category: string;
  is_system: boolean;
}

/**
 * User permission override - Nomenclatura del backend
 *
 * Permite/deniega permisos específicos por usuario (excepciones a roles)
 *
 * GET /api/v1/permissions/users/:id/overrides
 */
export interface UserPermissionOverride {
  id_user_permission_override: number;
  permission_code: string; // ej: "expedientes:delete"
  permission_description: string; // Descripción del permiso
  effect: "ALLOW" | "DENY";
  expires_at: string | null; // ISO datetime o null (sin expiración)
  is_expired: boolean; // TRUE si ya expiró
}

/**
 * Request to add user permission override
 * POST /api/v1/permissions/users/:userId/overrides
 */
export interface AddUserOverrideRequest {
  permission_code: string;
  effect: "ALLOW" | "DENY";
  expires_at?: string; // ISO datetime string, optional
}

/**
 * Response from get user overrides
 * GET /api/v1/permissions/users/:userId/overrides
 */
export interface UserOverridesResponse {
  user_id: number;
  overrides: UserPermissionOverride[];
}

/**
 * Override simplificado para permisos efectivos
 * Viene en GET /api/v1/permissions/users/:id/effective
 */
export interface EffectivePermissionOverride {
  permission_code: string;
  effect: "ALLOW" | "DENY";
  expires_at: string | null;
  is_expired: boolean;
}

/**
 * Rol con información completa (para permisos efectivos)
 */
export interface EffectivePermissionRole {
  id_rol: number;
  rol: string; // Nombre del rol
  desc_rol: string;
  is_primary: boolean;
}

/**
 * Response from get user effective permissions
 * GET /api/v1/permissions/users/:userId/effective
 *
 * Retorna:
 * - permissions: Array de códigos de permisos (strings simples)
 * - is_admin: Si el usuario tiene rol de admin
 * - roles: Roles asignados (con is_primary)
 * - landing_route: Ruta inicial del usuario
 * - overrides: Overrides activos (ALLOW/DENY)
 */
export interface UserEffectivePermissionsResponse {
  user_id: number;
  permissions: string[]; // Array de códigos: ["expedientes:read", "consultas:create", ...]
  is_admin: boolean;
  roles: EffectivePermissionRole[];
  landing_route: string;
  overrides: EffectivePermissionOverride[];
}
