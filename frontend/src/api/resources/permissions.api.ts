/**
 * Permissions API Resource
 *
 * Handles all permission-related API calls
 */

import apiClient from "@api/client";
import type {
  Permission,
  PermissionCatalogResponse,
  AssignPermissionRequest,
  AssignPermissionResponse,
  RevokePermissionRequest,
  RevokePermissionResponse,
  AddUserOverrideRequest,
  AddUserOverrideResponse,
  UserOverridesResponse,
} from "@api/schemas/permissions.schema";

export const permissionsAPI = {
  /**
   * Obtiene el catálogo completo de permisos disponibles
   * Solo admin
   */
  getPermissions: async (): Promise<PermissionCatalogResponse> => {
    const response =
      await apiClient.get<PermissionCatalogResponse>("/permissions");

    return response.data;
  },

  /**
   * Obtiene los permisos de un rol específico
   * Solo admin
   */
  getRolePermissions: async (roleId: number): Promise<Permission[]> => {
    const response = await apiClient.get<Permission[]>(
      `/permissions/role/${roleId}`,
    );
    return response.data;
  },

  /**
   * Asigna un permiso a un rol
   * Solo admin
   */
  assignPermission: async (
    roleId: number,
    data: AssignPermissionRequest,
  ): Promise<AssignPermissionResponse> => {
    const response = await apiClient.post<AssignPermissionResponse>(
      `/permissions/role/${roleId}/assign`,
      data,
    );
    return response.data;
  },

  /**
   * Revoca un permiso de un rol
   * Solo admin
   */
  revokePermission: async (
    roleId: number,
    data: RevokePermissionRequest,
  ): Promise<RevokePermissionResponse> => {
    const response = await apiClient.post<RevokePermissionResponse>(
      `/permissions/role/${roleId}/revoke`,
      data,
    );
    return response.data;
  },

  /**
   * Invalida el cache de permisos
   * Solo admin
   */
  invalidateCache: async (userId?: number): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/permissions/cache/invalidate",
      {
        user_id: userId,
      },
    );
    return response.data;
  },

  // ========== USER PERMISSION OVERRIDES (FASE 4) ==========

  /**
   * Agrega un override de permiso para un usuario
   * POST /api/v1/permissions/users/:userId/overrides
   * Requiere: usuarios:update
   */
  addUserOverride: async (
    userId: number,
    data: AddUserOverrideRequest,
  ): Promise<AddUserOverrideResponse> => {
    const response = await apiClient.post<AddUserOverrideResponse>(
      `/permissions/users/${userId}/overrides`,
      data,
    );
    return response.data;
  },

  /**
   * Elimina un override de permiso de un usuario
   * DELETE /api/v1/permissions/users/:userId/overrides/:permissionCode
   * Requiere: usuarios:update
   */
  removeUserOverride: async (
    userId: number,
    permissionCode: string,
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/permissions/users/${userId}/overrides/${permissionCode}`,
    );
    return response.data;
  },
};
