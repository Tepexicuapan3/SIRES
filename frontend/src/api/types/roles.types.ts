/**
 * Types for Roles API
 *
 * Contratos para RBAC gestión de roles
 */

import type { Permission } from "./permissions.types";

/**
 * Entidad Rol
 * Machea con la estructura de la tabla cat_roles
 */
export interface Role {
  id_rol: number;
  rol: string;
  desc_rol: string;
  is_active: boolean;
  is_system: boolean;
  landing_route: string;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
}

/**
 * Role con contadores de permisos y usuarios
 * Usado en vistas de lista
 */
export interface RoleWithCount extends Role {
  permissions_count: number;
  users_count: number; // Count de usuarios con este rol
}

/**
 * Peticion payload para crear un nuevo rol
 * POST /api/v1/roles
 */
export interface CreateRoleRequest {
  rol: string; // Required: código del rol (max 50 chars)
  desc_rol: string; // Required: descripción del rol
  landing_route?: string; // Optional: default "/inicio"
}

/**
 * Response de crear rol (Minima)
 */
export interface CreateRoleResponse {
  message: string;
  id_rol: number;
  rol: string; // Necesario para notificaciones (Toast)
}

/**
 * Peticion payload para actualizar un rol
 * PUT /api/v1/roles/:id
 */
export interface UpdateRoleRequest {
  rol?: string;
  desc_rol?: string;
  landing_route?: string;
  is_active?: boolean;
}

/**
 * Response de actualizar rol
 */
export interface UpdateRoleResponse {
  message: string;
  role: Role; // Completo para actualizaciones locales (Optimistic)
}

/**
 * Query params for GET /api/v1/roles
 */
export interface RolesListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}

/**
 * Response from GET /api/v1/roles (Full Paged)
 */
export interface RolesListResponse {
  items: RoleWithCount[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Response de GET /api/v1/roles/:id
 */
export interface RoleDetailResponse {
  role: Role;
  permissions: RolePermission[];
  permissions_count: number;
}

/**
 * Permisos asociados a un rol
 * Extiende la entidad Permission con metadatos de asignación
 */
export interface RolePermission extends Permission {
  assigned_by: string;
  assigned_at: string;
}

/**
 * Request a payload para asignar permisos a un rol
 * POST /api/v1/permissions/assign
 */
export interface AssignPermissionsRequest {
  role_id: number;
  permission_ids: number[];
}
