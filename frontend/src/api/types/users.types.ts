/**
 * User Types - Pure TypeScript interfaces
 * Tipos para gestión de usuarios, roles asignados y overrides.
 *
 * @description Interfaces para CRUD de usuarios y sub-recursos (roles, overrides).
 * Todos los campos usan camelCase en inglés según el estándar de la API.
 */

import type { PaginationParams, ListResponse } from "@api/types/common.types";
import type { PermissionEffect } from "@api/types/permissions.types";
import type { CentroAtencionRef } from "@api/types/catalogos/centros-atencion.types";

// =============================================================================
// OBJETOS ANIDADOS (Relaciones)
// =============================================================================

/**
 * Referencia a usuario (objeto anidado para auditoría).
 * Evita tener campos separados createdBy + createdByName.
 */
export interface UserRef {
  id: number;
  name: string;
}

// =============================================================================
// ENTIDADES PRINCIPALES
// =============================================================================

/**
 * Usuario en listado (tabla administrativa).
 * Contiene solo datos necesarios para identificar, filtrar y mostrar en tabla.
 *
 * GET /api/v1/users
 */
export interface UserListItem {
  id: number;
  username: string;
  fullname: string;
  email: string;
  clinic: CentroAtencionRef | null;
  primaryRole: string;
  isActive: boolean;
}

/**
 * Usuario con información completa (página de detalle/edición).
 * Incluye datos personales separados, estado de cuenta y auditoría.
 *
 * GET /api/v1/users/:id
 */
export interface UserDetail extends UserListItem {
  // --- Datos personales (para edición) ---
  /** Nombre(s) del usuario */
  firstName: string;
  paternalName: string;
  maternalName: string;

  // --- Estado de cuenta ---
  termsAccepted: boolean;
  mustChangePassword: boolean;

  // --- Auditoría de conexión ---
  lastLoginAt: string | null;
  lastIp: string | null;

  // --- Auditoría de registro ---
  createdAt: string;
  createdBy: UserRef;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

/**
 * Rol asignado a un usuario.
 * Incluye metadatos de asignación.
 */
export interface UserRole {
  id: number;
  name: string;
  description: string;
  isPrimary: boolean;
  assignedAt: string;
  assignedBy: UserRef;
}

/**
 * Override de permiso para un usuario.
 * Permite ALLOW o DENY de permisos específicos.
 */
export interface UserOverride {
  id: number;
  permissionCode: string;
  permissionDescription: string;
  effect: PermissionEffect;
  expiresAt: string | null;
  isExpired: boolean;
  assignedAt: string;
  assignedBy: UserRef;
}

// =============================================================================
// CRUD REQUESTS
// =============================================================================

/**
 * Request para crear un nuevo usuario.
 * POST /api/v1/users
 */
export interface CreateUserRequest {
  username: string;
  firstName: string;
  paternalName: string;
  maternalName: string;
  email: string;
  clinicId?: number | null;
  primaryRoleId: number;
}

/**
 * Request para actualizar un usuario existente.
 * PATCH /api/v1/users/:id
 */
export interface UpdateUserRequest {
  firstName?: string;
  paternalName?: string;
  maternalName?: string;
  email?: string;
  clinicId?: number | null;
}

// =============================================================================
// CRUD RESPONSES
// =============================================================================

/**
 * Response al crear un usuario (incluye contraseña temporal).
 * POST /api/v1/users
 */
export interface CreateUserResponse {
  id: number;
  username: string;
  /** Contraseña temporal generada (mostrar solo una vez) */
  temporaryPassword: string;
}

/**
 * Response al actualizar un usuario.
 * PATCH /api/v1/users/:id
 */
export interface UpdateUserResponse {
  user: UserDetail;
}

/**
 * Response al cambiar estado de un usuario (activar/desactivar).
 * PATCH /api/v1/users/:id/activate o /deactivate
 */
export interface UserStatusResponse {
  id: number;
  isActive: boolean;
}

// =============================================================================
// LISTADOS
// =============================================================================

/**
 * Parámetros para listar usuarios.
 * GET /api/v1/users
 */
export interface UsersListParams extends PaginationParams {
  isActive?: boolean;
  roleId?: number;
  clinicId?: number;
}

/**
 * Response paginada de listado de usuarios.
 * GET /api/v1/users
 */
export type UsersListResponse = ListResponse<UserListItem>;

// =============================================================================
// DETALLE
// =============================================================================

/**
 * Response con detalle completo de un usuario.
 * GET /api/v1/users/:id
 */
export interface UserDetailResponse {
  user: UserDetail;
  roles: UserRole[];
  overrides: UserOverride[];
}

// =============================================================================
// SUB-RECURSO: ROLES
// =============================================================================

/**
 * Request para asignar roles a un usuario.
 * POST /api/v1/users/:id/roles
 */
export interface AssignRolesRequest {
  roleIds: number[];
}

/**
 * Response al asignar roles.
 * POST /api/v1/users/:id/roles
 */
export interface AssignRolesResponse {
  userId: number;
  roles: UserRole[];
}

/**
 * Request para establecer rol primario.
 * PUT /api/v1/users/:id/roles/primary
 */
export interface SetPrimaryRoleRequest {
  roleId: number;
}

/**
 * Response al establecer rol primario.
 * PUT /api/v1/users/:id/roles/primary
 */
export interface SetPrimaryRoleResponse {
  userId: number;
  roles: UserRole[];
}

/**
 * Response al revocar un rol.
 * DELETE /api/v1/users/:id/roles/:roleId
 */
export interface RevokeRoleResponse {
  userId: number;
  roles: UserRole[];
}

// =============================================================================
// SUB-RECURSO: OVERRIDES
// =============================================================================

/**
 * Request para agregar un override de permiso.
 * POST /api/v1/users/:id/overrides
 */
export interface AddUserOverrideRequest {
  permissionCode: string;
  effect: PermissionEffect;
  expiresAt?: string;
}

/**
 * Response al agregar un override.
 * POST /api/v1/users/:id/overrides
 */
export interface AddUserOverrideResponse {
  userId: number;
  overrides: UserOverride[];
}

/**
 * Response al eliminar un override.
 * DELETE /api/v1/users/:id/overrides/:overrideId
 */
export interface RemoveUserOverrideResponse {
  userId: number;
  overrides: UserOverride[];
}
