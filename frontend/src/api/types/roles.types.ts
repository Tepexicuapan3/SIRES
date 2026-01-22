/**
 * Roles Types - Pure TypeScript interfaces
 * Tipos para gestión de roles y asignación de permisos.
 *
 * @description Interfaces para CRUD de roles y gestión de permisos.
 * Todos los campos usan camelCase en inglés según el estándar de la API.
 *
 * Estrategia de entidades:
 * - RoleRef: Referencia mínima para relaciones (ej: UserRole)
 * - RoleListItem: Para tablas/listados (sin auditoría, con contadores)
 * - RoleDetail: Para detalle/edición (con auditoría completa)
 */

import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

/**
 * Referencia mínima a un rol.
 * Usada en relaciones (ej: UserRole, asignaciones).
 */
export interface RoleRef {
  id: number;
  name: string;
}

/**
 * Rol para listado en tabla.
 * Incluye contadores pero NO campos de auditoría (optimizado para tablas).
 */
export interface RoleListItem {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  landingRoute: string | null;
  permissionsCount: number;
  usersCount: number;
}

/**
 * Rol con detalle completo para edición.
 * Extiende RoleListItem con campos de auditoría.
 */
export interface RoleDetail extends RoleListItem {
  createdAt: string;
  createdBy: UserRef;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

/**
 * Permiso asignado a un rol (formato simplificado).
 * Usado en RoleDetailResponse para mostrar permisos del rol.
 */
export interface RolePermission {
  id: number;
  code: string;
  description: string;
  assignedAt: string;
  assignedBy: UserRef;
}

// =============================================================================
// REQUESTS
// =============================================================================

/**
 * Request para crear un nuevo rol.
 * POST /api/v1/roles
 */
export interface CreateRoleRequest {
  name: string;
  description: string;
  landingRoute?: string;
}

/**
 * Request para actualizar un rol existente.
 * PUT /api/v1/roles/:id
 */
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  landingRoute?: string;
  isActive?: boolean;
}

/**
 * Request para asignar permisos a un rol.
 * POST /api/v1/roles/:id/permissions
 */
export interface AssignPermissionsRequest {
  permissionIds: number[];
}

/**
 * Request para revocar permisos de un rol.
 * DELETE /api/v1/roles/:id/permissions
 */
export interface RevokePermissionsRequest {
  permissionIds: number[];
}

// =============================================================================
// RESPONSES
// =============================================================================

/**
 * Response de listado de roles (paginado).
 * GET /api/v1/roles
 */
export type RolesListResponse = ListResponse<RoleListItem>;

/**
 * Response de detalle de un rol con sus permisos.
 * GET /api/v1/roles/:id
 */
export interface RoleDetailResponse {
  role: RoleDetail;
  permissions: RolePermission[];
}

/**
 * Response de creación de rol.
 * POST /api/v1/roles
 */
export interface CreateRoleResponse {
  id: number;
  name: string;
}

/**
 * Response de actualización de rol.
 * PUT /api/v1/roles/:id
 */
export interface UpdateRoleResponse {
  role: RoleDetail;
}

/**
 * Response de eliminación de rol.
 * DELETE /api/v1/roles/:id
 */
export type DeleteRoleResponse = SuccessResponse;

/**
 * Response de asignación de permisos a rol.
 * POST /api/v1/roles/:id/permissions
 */
export interface AssignPermissionsResponse {
  roleId: number;
  permissions: RolePermission[];
}

/**
 * Response de revocación de permisos de un rol.
 * DELETE /api/v1/roles/:id/permissions
 */
export interface RevokePermissionsResponse {
  roleId: number;
  permissions: RolePermission[];
}

// =============================================================================
// PARAMS
// =============================================================================

/**
 * Parámetros para listar roles.
 * GET /api/v1/roles
 */
export interface RolesListParams extends PaginationParams {
  isActive?: boolean;
  isSystem?: boolean;
}
