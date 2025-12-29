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
