/**
 * Users API Resource
 *
 * Handles user management API calls
 */

import apiClient from "@api/client";
import type {
  CreateUserRequest,
  CreateUserResponse,
  UserRole,
  AssignRolesRequest,
  SetPrimaryRoleRequest,
  UserRolesResponse,
} from "@api/types/users.types";

export const usersAPI = {
  /**
   * Crea un nuevo usuario
   * Solo admin
   */
  create: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await apiClient.post<CreateUserResponse>("/users", data);
    return response.data;
  },

  // ========== MULTI-ROL DE USUARIOS (FASE 3) ==========

  /**
   * Obtiene lista de roles asignados a un usuario
   * GET /api/v1/users/:id/roles
   * Requiere: usuarios:read
   */
  getUserRoles: async (userId: number): Promise<UserRole[]> => {
    const response = await apiClient.get<{ roles: UserRole[] }>(
      `/users/${userId}/roles`,
    );
    return response.data.roles;
  },

  /**
   * Asigna múltiples roles a un usuario
   * POST /api/v1/users/:id/roles
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
   * Cambia el rol primario de un usuario
   * PUT /api/v1/users/:id/roles/primary
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
   * Revoca un rol de un usuario
   * DELETE /api/v1/users/:id/roles/:roleId
   * Requiere: usuarios:update
   *
   * NOTA:
   * - No permite revocar el último rol del usuario
   * - Si revoca el rol primario, auto-asigna otro como primario
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
