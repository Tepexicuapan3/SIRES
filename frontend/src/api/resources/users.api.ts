/**
 * Users API Resource
 *
 * Gestión completa de usuarios dividida en sub-recursos lógicos.
 *
 * ESTRUCTURA:
 * - Core: CRUD básico de perfil y estados.
 * - Roles: Gestión de roles asignados.
 * - Overrides: Gestión de excepciones de permisos.
 *
 * PERMISOS:
 * Patrón: ADMIN:GESTION:USUARIOS:{ACCION}
 */

import apiClient from "@api/client";
import type {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UserStatusResponse,
  UsersListParams,
  UsersListResponse,
  UserDetailResponse,
  UserRolesListResponse,
  AssignRolesRequest,
  AssignRolesResponse,
  SetPrimaryRoleRequest,
  SetPrimaryRoleResponse,
  RevokeRoleResponse,
  UserOverridesResponse,
  AddUserOverrideRequest,
  AddUserOverrideResponse,
} from "@api/schemas/users.schema";

export const usersAPI = {
  // ==========================================
  // 1. CORE: PERFIL Y ESTADOS
  // ==========================================

  /**
   * Listar usuarios con paginación.
   * @endpoint GET /api/v1/users
   * @permission admin:gestion:usuarios:read
   */
  getAll: async (params?: UsersListParams): Promise<UsersListResponse> => {
    const response = await apiClient.get<UsersListResponse>("/users", {
      params,
    });
    return response.data;
  },

  /**
   * Obtener detalle completo (Perfil + Roles + Overrides).
   * @endpoint GET /api/v1/users/:id
   * @permission admin:gestion:usuarios:read
   */
  getById: async (userId: number): Promise<UserDetailResponse> => {
    const response = await apiClient.get<UserDetailResponse>(
      `/users/${userId}`,
    );
    return response.data;
  },

  /**
   * Crear usuario.
   * @endpoint POST /api/v1/users
   * @permission admin:gestion:usuarios:create
   */
  create: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await apiClient.post<CreateUserResponse>("/users", data);
    return response.data;
  },

  /**
   * Actualizar perfil básico.
   * @endpoint PATCH /api/v1/users/:id
   * @permission admin:gestion:usuarios:update
   */
  update: async (
    userId: number,
    data: UpdateUserRequest,
  ): Promise<UpdateUserResponse> => {
    const response = await apiClient.patch<UpdateUserResponse>(
      `/users/${userId}`,
      data,
    );
    return response.data;
  },

  /**
   * Activar usuario.
   * @endpoint PATCH /api/v1/users/:id/activate
   * @permission admin:gestion:usuarios:update
   */
  activate: async (userId: number): Promise<UserStatusResponse> => {
    const response = await apiClient.patch<UserStatusResponse>(
      `/users/${userId}/activate`,
    );
    return response.data;
  },

  /**
   * Desactivar usuario.
   * @endpoint PATCH /api/v1/users/:id/deactivate
   * @permission admin:gestion:usuarios:update
   */
  deactivate: async (userId: number): Promise<UserStatusResponse> => {
    const response = await apiClient.patch<UserStatusResponse>(
      `/users/${userId}/deactivate`,
    );
    return response.data;
  },

  // ==========================================
  // 2. SUB-RECURSO: ROLES
  // ==========================================
  roles: {
    /**
     * Listar roles asignados a un usuario.
     * @endpoint GET /api/v1/users/:id/roles
     * @permission admin:gestion:usuarios:read
     */
    list: async (userId: number): Promise<UserRolesListResponse> => {
      const response = await apiClient.get<UserRolesListResponse>(
        `/users/${userId}/roles`,
      );
      return response.data;
    },

    /**
     * Asignar roles adicionales.
     * @endpoint POST /api/v1/users/:id/roles
     * @permission admin:gestion:usuarios:update
     */
    assign: async (
      userId: number,
      data: AssignRolesRequest,
    ): Promise<AssignRolesResponse> => {
      const response = await apiClient.post<AssignRolesResponse>(
        `/users/${userId}/roles`,
        data,
      );
      return response.data;
    },

    /**
     * Establecer rol primario.
     * @endpoint PUT /api/v1/users/:id/roles/primary
     * @permission admin:gestion:usuarios:update
     */
    setPrimary: async (
      userId: number,
      data: SetPrimaryRoleRequest,
    ): Promise<SetPrimaryRoleResponse> => {
      const response = await apiClient.put<SetPrimaryRoleResponse>(
        `/users/${userId}/roles/primary`,
        data,
      );
      return response.data;
    },

    /**
     * Revocar rol secundario.
     * @endpoint DELETE /api/v1/users/:id/roles/:roleId
     * @permission admin:gestion:usuarios:update
     */
    revoke: async (
      userId: number,
      roleId: number,
    ): Promise<RevokeRoleResponse> => {
      const response = await apiClient.delete<RevokeRoleResponse>(
        `/users/${userId}/roles/${roleId}`,
      );
      return response.data;
    },
  },

  // ==========================================
  // 3. SUB-RECURSO: OVERRIDES (Permisos)
  // ==========================================
  overrides: {
    /**
     * Listar excepciones de permisos.
     * @endpoint GET /api/v1/users/:id/overrides
     * @permission admin:gestion:usuarios:read
     */
    list: async (userId: number): Promise<UserOverridesResponse> => {
      const response = await apiClient.get<UserOverridesResponse>(
        `/users/${userId}/overrides`,
      );
      return response.data;
    },

    /**
     * Agregar excepción (Allow/Deny).
     * @endpoint POST /api/v1/users/:id/overrides
     * @permission admin:gestion:usuarios:update
     */
    add: async (
      userId: number,
      data: AddUserOverrideRequest,
    ): Promise<AddUserOverrideResponse> => {
      const response = await apiClient.post<AddUserOverrideResponse>(
        `/users/${userId}/overrides`,
        data,
      );
      return response.data;
    },

    /**
     * Eliminar excepción.
     * @endpoint DELETE /api/v1/users/:id/overrides/:code
     * @permission admin:gestion:usuarios:update
     */
    remove: async (
      userId: number,
      permissionCode: string,
    ): Promise<{ message: string }> => {
      const response = await apiClient.delete<{ message: string }>(
        `/users/${userId}/overrides/${permissionCode}`,
      );
      return response.data;
    },
  },
};
