/**
 * Permissions API Resource
 *
 * Handles all permission-related API calls
 */

import apiClient from "@api/client";
import type {
  PermissionCatalogResponse,
  RolesListResponse,
  RolePermissionsResponse,
  AssignPermissionRequest,
  RevokePermissionRequest,
  AssignPermissionResponse,
} from "@api/types/permissions.types";

export const permissionsAPI = {
  /**
   * Obtiene el catálogo completo de permisos disponibles
   * Solo admin
   */
  getCatalog: async (): Promise<PermissionCatalogResponse> => {
    const response = await apiClient.get<PermissionCatalogResponse>(
      "/permissions/catalog",
    );
    return response.data;
  },

  /**
   * Obtiene todos los roles con su count de permisos
   * Solo admin
   */
  getRoles: async (): Promise<RolesListResponse> => {
    const response =
      await apiClient.get<RolesListResponse>("/permissions/roles");
    return response.data;
  },

  /**
   * Obtiene los permisos de un rol específico
   * Solo admin
   */
  getRolePermissions: async (
    roleId: number,
  ): Promise<RolePermissionsResponse> => {
    const response = await apiClient.get<RolePermissionsResponse>(
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
  ): Promise<AssignPermissionResponse> => {
    const response = await apiClient.post<AssignPermissionResponse>(
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
};
