/**
 * Types for Roles API
 *
 * Contracts for RBAC 2.0 role management
 */

/**
 * Role entity from backend
 * Matches cat_roles table structure
 */
export interface Role {
  id_rol: number;
  cod_rol: string;
  nom_rol: string;
  landing_route: string;
  priority: number;
  is_admin: number; // 0 or 1 (boolean flag)
  usr_alta: string;
  fch_alta: string;
  usr_mod?: string | null;
  fch_mod?: string | null;
}

/**
 * Role with permissions count
 * Used in list views
 */
export interface RoleWithCount extends Role {
  permissions_count: number;
}

/**
 * Request payload for creating a new role
 * POST /api/v1/roles
 */
export interface CreateRoleRequest {
  nombre: string; // Required: max 50 chars
  descripcion?: string; // Optional
  landing_route?: string; // Optional: default "/inicio"
  priority?: number; // Optional: default 100
  is_admin?: boolean; // Optional: default false
}

/**
 * Request payload for updating a role
 * PUT /api/v1/roles/:id
 */
export interface UpdateRoleRequest {
  nombre?: string; // Optional: max 50 chars
  descripcion?: string; // Optional
  landing_route?: string; // Optional
  priority?: number; // Optional
}

/**
 * Response from create/update role
 */
export interface RoleResponse {
  id_rol: number;
  cod_rol: string;
  nom_rol: string;
  landing_route: string;
  priority: number;
  is_admin: number;
}

/**
 * Response from GET /api/v1/roles
 */
export interface RolesListResponse {
  total: number;
  roles: RoleWithCount[];
}

/**
 * Response from GET /api/v1/roles/:id
 */
export interface RoleDetailResponse {
  role: Role;
  permissions: RolePermission[];
  permissions_count: number;
}

/**
 * Permission assigned to a role
 * Includes assignment metadata
 */
export interface RolePermission {
  id_permission: number;
  code: string;
  resource: string;
  action: string;
  description: string;
  category: string;
  assigned_by: string;
  assigned_at: string;
}

/**
 * Request to assign multiple permissions to a role
 * POST /api/v1/permissions/assign
 */
export interface AssignPermissionsRequest {
  role_id: number;
  permission_ids: number[];
}

/**
 * User role assignment
 * From users_roles table
 */
export interface UserRole {
  id_rol: number;
  cod_rol: string;
  nom_rol: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by: string;
}
