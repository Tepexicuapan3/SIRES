/**
 * Users API Resource
 *
 * Handles user management API calls
 *
 * FILOSOFÍA: Sin mapeos intermedios - retornamos los datos del backend tal cual.
 * Los tipos ya están alineados 1:1 con el backend en users.types.ts
 */

import apiClient from "@api/client";
import type {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UserRole,
  AssignRolesRequest,
  SetPrimaryRoleRequest,
  UserRolesResponse,
  UsersListResponse,
  UsersListParams,
  UserDetailResponse,
} from "@api/types/users.types";

export const usersAPI = {
  // ========== CRUD DE USUARIOS ==========

  /**
   * Listar usuarios con paginación y filtros
   * GET /api/v1/users
   *
   * @param params - Parámetros de filtrado y paginación
   * @returns Lista paginada de usuarios
   *
   * Requiere: usuarios:read
   */
  getUsers: async (params?: UsersListParams): Promise<UsersListResponse> => {
    const response = await apiClient.get<UsersListResponse>("/users", {
      params,
    });
    return response.data;
  },

  /**
   * Obtener detalle completo de un usuario
   * GET /api/v1/users/:id
   *
   * Incluye:
   * - Datos completos del usuario (con auditoría)
   * - Roles asignados
   *
   * Requiere: usuarios:read
   */
  getUser: async (userId: number): Promise<UserDetailResponse> => {
    const response = await apiClient.get<UserDetailResponse>(
      `/users/${userId}`,
    );
    return response.data;
  },

  /**
   * Crear nuevo usuario
   * POST /api/v1/users
   *
   * IMPORTANTE: La respuesta incluye contraseña temporal que se muestra UNA SOLA VEZ.
   * El admin debe copiarla y entregarla al usuario.
   *
   * Requiere: usuarios:create
   */
  createUser: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await apiClient.post<CreateUserResponse>("/users", data);
    return response.data;
  },

  /**
   * Actualizar datos básicos de usuario
   * PATCH /api/v1/users/:id
   *
   * Solo enviar campos que se quieren modificar (partial update)
   *
   * Requiere: usuarios:update
   */
  updateUser: async (
    userId: number,
    data: UpdateUserRequest,
  ): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(
      `/users/${userId}`,
      data,
    );
    return response.data;
  },

  /**
   * Activar usuario (cambiar estado a "A")
   * PATCH /api/v1/users/:id/activate
   *
   * Permite al usuario volver a acceder al sistema
   *
   * Requiere: usuarios:update
   */
  activateUser: async (userId: number): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(
      `/users/${userId}/activate`,
    );
    return response.data;
  },

  /**
   * Desactivar usuario (cambiar estado a "B")
   * PATCH /api/v1/users/:id/deactivate
   *
   * El usuario no podrá iniciar sesión hasta que sea reactivado
   *
   * Requiere: usuarios:update
   */
  deactivateUser: async (userId: number): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(
      `/users/${userId}/deactivate`,
    );
    return response.data;
  },

  // ========== GESTIÓN DE ROLES (MULTI-ROL) ==========

  /**
   * Obtener roles asignados a un usuario
   * GET /api/v1/users/:id
   *
   * NOTA: Este endpoint retorna el objeto completo {user, roles}.
   * Extraemos solo el array de roles.
   *
   * CAMBIO vs versión anterior:
   * - YA NO hay mapeo de campos (backend usa "rol" y "desc_rol")
   * - Retornamos los datos tal cual vienen del backend
   *
   * Requiere: usuarios:read
   */
  getUserRoles: async (userId: number): Promise<UserRole[]> => {
    const response = await apiClient.get<UserDetailResponse>(
      `/users/${userId}`,
    );

    // Validación defensiva
    if (!response.data || !Array.isArray(response.data.roles)) {
      throw new Error("Invalid user roles response from backend");
    }

    // ✅ Sin mapeo - retornamos directo (tipos ya alineados)
    return response.data.roles;
  },

  /**
   * Asignar múltiples roles a un usuario
   * POST /api/v1/users/:id/roles
   *
   * Permite asignar varios roles de una sola vez (bulk assignment)
   *
   * Requiere: usuarios:update
   */
  assignRoles: async (
    userId: number,
    data: AssignRolesRequest,
  ): Promise<UserRolesResponse> => {
    const response = await apiClient.post<UserRolesResponse>(
      `/users/${userId}/roles`,
      data,
    );
    return response.data;
  },

  /**
   * Cambiar el rol primario de un usuario
   * PUT /api/v1/users/:id/roles/primary
   *
   * El rol primario determina:
   * - Landing page al iniciar sesión
   * - Permisos base del usuario
   *
   * Requiere: usuarios:update
   */
  setPrimaryRole: async (
    userId: number,
    data: SetPrimaryRoleRequest,
  ): Promise<UserRolesResponse> => {
    const response = await apiClient.put<UserRolesResponse>(
      `/users/${userId}/roles/primary`,
      data,
    );
    return response.data;
  },

  /**
   * Revocar (eliminar) un rol de un usuario
   * DELETE /api/v1/users/:id/roles/:roleId
   *
   * REGLAS DE NEGOCIO (validadas en backend):
   * - No permitir revocar el último rol del usuario
   * - Si se revoca rol primario, auto-asigna otro como primario
   *
   * Requiere: usuarios:update
   */
  revokeRole: async (
    userId: number,
    roleId: number,
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/users/${userId}/roles/${roleId}`,
    );
    return response.data;
  },
};
