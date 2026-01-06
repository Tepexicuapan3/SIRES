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
  total: number;
  permissions: Permission[];
  by_category: Record<string, Permission[]>;
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
 * User permission override
 * Allows/denies specific permissions per user
 */
export interface UserPermissionOverride {
  id_user_permission_override: number;
  permission_code: string;
  permission_name: string;
  effect: "ALLOW" | "DENY";
  expires_at: string | null;
  created_by: string;
  created_at: string;
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
 * Effective permission for a user
 * Result of merging role permissions + overrides
 */
export interface EffectivePermission {
  code: string;
  name: string;
  source: "ROLE" | "OVERRIDE_ALLOW" | "OVERRIDE_DENY";
  role_name?: string; // If source is ROLE
  expires_at?: string; // If source is OVERRIDE_*
}

/**
 * Response from get user effective permissions
 * GET /api/v1/permissions/users/:userId/effective
 */
export interface UserEffectivePermissionsResponse {
  user_id: number;
  permissions: EffectivePermission[];
  overrides_count: number;
}
