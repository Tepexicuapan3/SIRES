/**
 * Types para Permissions API
 *
 * Estrategia Code-First: Los permisos son estructurales y se definen en el código.
 * No hay CRUD, solo catálogo de solo lectura.
 */

export interface Permission {
  id_permission: number;
  code: string; // Formato jerárquico: GRUPO:MODULO:SUBMODULO:ACCION
  description: string;
}

export interface PermissionCatalogResponse {
  items: Permission[];
  total: number;
}

// Request types para asignación y revocación de permisos a roles
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
 * User permission override
 */
export interface UserPermissionOverride {
  id_user_permission_override: number;
  permission_code: string;
  permission_description: string;
  effect: "ALLOW" | "DENY";
  expires_at: string | null;
  is_expired: boolean;
  assigned_at: string;
  assigned_by: string;
}

/**
 * Request para agregar un override de permiso a un usuario
 */

export interface AddUserOverrideRequest {
  permission_code: string;
  effect: "ALLOW" | "DENY";
  expires_at?: string;
}

/**
 * Response de get user overrides
 */

export interface UserOverridesResponse {
  user_id: number;
  overrides: UserPermissionOverride[];
}
