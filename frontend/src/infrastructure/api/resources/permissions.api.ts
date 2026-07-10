/**
 * Permissions API Resource
 *
 * Handles all permission-related API calls
 */

import apiClient from "@api/client";
import type {
  CreatePermissionRequest,
  CreatePermissionResponse,
  PermissionCatalogResponse,
} from "@api/types/permissions.types";

export const permissionsAPI = {
  /**
   * Obtiene el catálogo completo de permisos disponibles
   * @endpoint GET /api/v1/permissions
   * @permission admin:gestion:permisos:read
   */
  getAll: async (): Promise<PermissionCatalogResponse> => {
    const response =
      await apiClient.get<PermissionCatalogResponse>("/permissions");

    return response.data;
  },

  /**
   * Compat: alias legacy.
   */
  getPermissions: async (): Promise<PermissionCatalogResponse> => {
    const response =
      await apiClient.get<PermissionCatalogResponse>("/permissions");
    return response.data;
  },

  /**
   * Crea un permiso nuevo en el catalogo (modulo:submodulo:accion).
   * @endpoint POST /api/v1/permisos
   * @permission admin:catalogos:permisos:create
   */
  create: async (
    data: CreatePermissionRequest,
  ): Promise<CreatePermissionResponse> => {
    const response = await apiClient.post<CreatePermissionResponse>(
      "/permisos/",
      data,
    );
    return response.data;
  },
};
