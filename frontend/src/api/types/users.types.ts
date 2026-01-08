/**
 * Types for Users API
 *
 * Contracts for user management
 */

/**
 * User entity
 * Represents a user in the system
 */
export interface User {
  id_usuario: number;
  usuario: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  numero_expediente: string | null;
  correo: string;
  activo: boolean;
  ultimo_acceso: string | null;
  roles?: UserRole[]; // Populated when fetching with roles
}

export interface CreateUserRequest {
  usuario: string;
  expediente: string;
  nombre: string;
  paterno: string;
  materno: string;
  curp: string;
  correo: string;
  id_rol: number;
}

export interface CreateUserResponse {
  message: string;
  user: {
    id_usuario: number;
    usuario: string;
    expediente: string;
    temp_password: string;
    must_change_password: boolean;
    rol_asignado: number;
  };
}

/**
 * User role assignment (backend DTO)
 * Estructura que retorna el backend desde users_roles + cat_roles
 */
export interface UserRoleBackendDTO {
  id_rol: number;
  rol: string; // ← Backend usa "rol", no "nombre"
  desc_rol: string;
  is_primary: boolean;
  est_usr_rol?: string; // Estado (opcional)
}

/**
 * User role assignment (frontend model)
 * From users_roles table (FASE 3)
 */
export interface UserRole {
  id_rol: number;
  nombre: string; // Nombre del rol (ej: "ADMIN", "MÉDICO")
  descripcion?: string; // Descripción del rol
  is_primary: boolean;
  priority: number; // Prioridad del rol (default 999 si no viene)
  assigned_at?: string;
  assigned_by?: string;
}

/**
 * Request to assign roles to a user
 * POST /api/v1/users/:id/roles
 */
export interface AssignRolesRequest {
  role_ids: number[]; // Array de IDs de roles a asignar
  primary_role_id?: number; // Opcional: cuál marcar como primario
}

/**
 * Request to set primary role
 * PUT /api/v1/users/:id/roles/primary
 */
export interface SetPrimaryRoleRequest {
  role_id: number;
}

/**
 * Response from assign/update user roles
 */
export interface UserRolesResponse {
  user_id: number;
  roles: UserRole[];
  primary_role: UserRole;
}

/**
 * Response from GET /api/v1/users
 * Paginated list of users
 *
 * IMPORTANTE: El backend retorna un objeto wrapper, NO un array directo.
 * Esto permite agregar metadata de paginación sin romper el contrato.
 */
export interface UsersListResponse {
  items: User[]; // Usuarios de la página actual
  page: number; // Página actual (1-indexed)
  page_size: number; // Registros por página
  total: number; // Total de usuarios (todas las páginas)
  total_pages: number; // Total de páginas
}

/**
 * User data tal como viene del backend (raw DTO)
 * Nomenclatura de base de datos MySQL (nombres cortos, español)
 *
 * Este tipo representa el CONTRATO real con el backend.
 * NO usarlo en componentes, solo para mapeo en adapters.
 */
export interface UserBackendDTO {
  id_usuario: number;
  usuario: string;
  nombre: string;
  paterno: string; // Backend usa nombre corto
  materno: string; // Backend usa nombre corto
  expediente: string | null; // Backend usa nombre corto
  correo: string;
  est_usuario: "A" | "B"; // Backend usa códigos ('A'=Activo, 'B'=Baja)
  last_conexion: string | null; // Backend usa inglés + snake_case
  img_perfil: string | null;
  // Campos que pueden venir del JOIN con users_roles (opcional)
  rol_primario?: string; // Nombre del rol primario
  roles?: UserRole[]; // Populated cuando se hace join
}
