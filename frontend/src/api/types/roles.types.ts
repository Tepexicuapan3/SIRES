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
  rol: string; // Código del rol (ej: "MEDICOS")
  desc_rol: string; // Descripción del rol (ej: "Médicos del servicio")
  tp_rol?: string; // Tipo de rol (ej: "ADMIN", "CUSTOM")
  est_rol: "A" | "B"; // Estado: A=Activo, B=Baja
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
  users_count: number; // Count de usuarios con este rol
}

/**
 * Request payload for creating a new role
 * POST /api/v1/roles
 */
export interface CreateRoleRequest {
  rol: string; // Required: código del rol (max 50 chars)
  desc_rol: string; // Required: descripción del rol
  tp_rol?: string; // Optional: tipo de rol (default "ADMIN")
  landing_route?: string; // Optional: default "/inicio"
  priority?: number; // Optional: default 999
  is_admin?: boolean; // Optional: default false
}

/**
 * Request payload for updating a role
 * PUT /api/v1/roles/:id
 */
export interface UpdateRoleRequest {
  rol?: string; // Optional: código del rol (max 50 chars)
  desc_rol?: string; // Optional: descripción del rol
  tp_rol?: string; // Optional: tipo de rol
  landing_route?: string; // Optional
  priority?: number; // Optional
}

/**
 * Response from create/update role
 */
export interface RoleResponse {
  id_rol: number;
  rol: string;
  desc_rol: string;
  tp_rol?: string;
  est_rol: "A" | "B";
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
  rol: string;
  desc_rol: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by: string;
}
