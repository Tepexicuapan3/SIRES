/**
 * Permissions API Resource
 *
 * Handles all permission-related API calls
 */

import apiClient from "@api/client";
import type {
  PermissionCatalogResponse
} from "@api/types/permissions.types";

export const permissionsAPI = {
  /**
   * Obtiene el catálogo completo de permisos disponibles
   * @endpoint GET /api/v1/permissions
   * @permission admin:config:permissions:read
   */
  getAll: async (): Promise<PermissionCatalogResponse> => {
    const response = await apiClient.get<PermissionCatalogResponse>(
      "/permissions",
    );

    return response.data;
  },
};
