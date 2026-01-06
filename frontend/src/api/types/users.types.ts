/**
 * Types for Users API
 *
 * Contracts for user management
 */

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
 * User role assignment
 * From users_roles table (FASE 3)
 */
export interface UserRole {
  id_rol: number;
  cod_rol: string;
  nom_rol: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by: string;
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
