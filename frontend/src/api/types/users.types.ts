/**
 * Types para Users API
 *
 * IMPORTANTE: Estos tipos usan la nomenclatura EXACTA del backend (MySQL).
 * NO hay mapeo intermedio - usamos los nombres de campos tal cual los retorna la API.
 */

import type { UserPermissionOverride } from "./permissions.types";

// ==========================================
// 1. ENTIDADES BASE (Modelos de DB)
// ==========================================

/**
 * User entity - Nomenclatura del backend (MySQL)
 * Base común para AuthUser y User (CRUD).
 */
export interface BaseUser {
  id_usuario: number;
  usuario: string;
  nombre: string;
  paterno: string;
  materno: string;
  expediente: string | null;
  id_clin: number | null;
  correo: string;
  rol_primario: string;
}

/**
 * User entity para CRUD (Listados y Detalle)
 */
export interface User extends BaseUser {
  is_active: boolean;
  last_conexion: string | null;
}

/**
 * User con metadatos de auditoría completos
 */
export interface UserDetail extends User {
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
  terminos_acept: boolean;
  cambiar_clave: boolean;
  ip_ultima: string | null;
}

/**
 * Rol asignado a un usuario
 */
export interface UserRole {
  id_rol: number;
  rol: string;
  desc_rol: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by: string;
}

// ==========================================
// 2. REQUEST / RESPONSE TYPES (Operaciones)
// ==========================================

// --- CORE CRUD ---

export interface CreateUserRequest {
  usuario: string;
  expediente: string;
  nombre: string;
  paterno: string;
  materno: string;
  id_clin: number | null;
  correo: string;
  id_rol: number;
}

export interface CreateUserResponse {
  message: string;
  user: {
    id_usuario: number;
    usuario: string;
    temp_password: string;
  };
}

export interface UpdateUserRequest {
  nombre?: string;
  paterno?: string;
  materno?: string;
  correo?: string;
  id_clin?: number | null;
}

export interface UpdateUserResponse {
  message: string;
  user: User;
}

export interface UserStatusResponse {
  message: string;
  user: User;
}

// --- LISTADOS ---

export interface UsersListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  rol_id?: number;
}

export interface UsersListResponse {
  items: User[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface UserDetailResponse {
  user: UserDetail;
  roles: UserRole[];
  overrides: UserPermissionOverride[];
}

// --- SUB-RECURSO: ROLES ---

export interface UserRolesListResponse {
  user_id: number;
  roles: UserRole[];
}

export interface AssignRolesRequest {
  role_ids: number[];
}

export interface AssignRolesResponse {
  message: string;
  user_id: number;
  assigned_count: number;
  role_ids: number[];
}

export interface SetPrimaryRoleRequest {
  role_id: number;
}

export interface SetPrimaryRoleResponse {
  message: string;
  user_id: number;
  role_id: number;
}

export interface RevokeRoleResponse {
  message: string;
  user_id: number;
  revoked_role_id: number;
}

// --- SUB-RECURSO: OVERRIDES ---

export interface AddUserOverrideRequest {
  permission_code: string;
  effect: "ALLOW" | "DENY";
  expires_at?: string;
}

export interface AddUserOverrideResponse {
  message: string;
  user_id: number;
  permission_code: string;
  effect: "ALLOW" | "DENY";
}

export interface UserOverridesResponse {
  user_id: number;
  overrides: UserPermissionOverride[];
}
