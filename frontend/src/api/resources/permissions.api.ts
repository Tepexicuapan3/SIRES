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
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PermissionResponse,
  AddUserOverrideRequest,
  UserOverridesResponse,
  UserEffectivePermissionsResponse,
} from "@api/types/permissions.types";

export const permissionsAPI = {
  /**
   * Obtiene el catálogo completo de permisos disponibles
   * Solo admin
   *
   * IMPORTANTE: Backend retorna {total, permissions, by_category}
   * Aquí retornamos el objeto completo porque contiene agrupación útil
   */
  getCatalog: async (): Promise<PermissionCatalogResponse> => {
    const response = await apiClient.get<PermissionCatalogResponse>(
      "/permissions/catalog",
    );

    // Validación defensiva
    if (!response.data || !Array.isArray(response.data.permissions)) {
      console.error("Invalid permissions catalog response:", response.data);
      throw new Error("Invalid permissions catalog response from backend");
    }

    return response.data;
  },

  /**
   * Obtiene todos los roles con su count de permisos
   * Solo admin
   *
   * IMPORTANTE: Backend retorna {total, roles}
   * Aquí retornamos el objeto completo (mismo que roles.api.getRoles pero desde endpoint diferente)
   */
  getRoles: async (): Promise<RolesListResponse> => {
    const response =
      await apiClient.get<RolesListResponse>("/permissions/roles");

    // Validación defensiva
    if (!response.data || !Array.isArray(response.data.roles)) {
      console.error("Invalid roles response:", response.data);
      throw new Error("Invalid roles response from backend");
    }

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

  // ========== CRUD DE PERMISOS (FASE 2) ==========

  /**
   * Crea un nuevo permiso
   * POST /api/v1/permissions
   * Requiere: permisos:create
   */
  createPermission: async (
    data: CreatePermissionRequest,
  ): Promise<PermissionResponse> => {
    const response = await apiClient.post<PermissionResponse>(
      "/permissions",
      data,
    );
    return response.data;
  },

  /**
   * Actualiza un permiso existente
   * PUT /api/v1/permissions/:id
   * Requiere: permisos:update
   *
   * NOTA:
   * - Solo permite modificar description y category
   * - No permite editar permisos del sistema (is_system=true)
   */
  updatePermission: async (
    id: number,
    data: UpdatePermissionRequest,
  ): Promise<PermissionResponse> => {
    const response = await apiClient.put<PermissionResponse>(
      `/permissions/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * Elimina un permiso
   * DELETE /api/v1/permissions/:id
   * Requiere: permisos:delete
   *
   * NOTA:
   * - No permite eliminar permisos del sistema (is_system=true)
   * - Elimina también todas las asignaciones a roles
   */
  deletePermission: async (id: number): Promise<void> => {
    await apiClient.delete(`/permissions/${id}`);
  },

  /**
   * Obtiene un permiso por ID
   * GET /api/v1/permissions/:id
   * Requiere: permisos:read
   */
  getPermission: async (id: number): Promise<PermissionResponse> => {
    const response = await apiClient.get<PermissionResponse>(
      `/permissions/${id}`,
    );
    return response.data;
  },

  /**
   * Lista todos los permisos (alternativa a getCatalog)
   * GET /api/v1/permissions
   * Requiere: permisos:read
   *
   * IMPORTANTE: Backend retorna {permissions: [...]}
   * Aquí extraemos solo el array para simplificar uso
   */
  getPermissions: async (): Promise<PermissionResponse[]> => {
    const response = await apiClient.get<{ permissions: PermissionResponse[] }>(
      "/permissions",
    );

    // Validación defensiva
    if (!response.data || !Array.isArray(response.data.permissions)) {
      console.error("Invalid permissions response:", response.data);
      throw new Error("Invalid permissions response from backend");
    }

    return response.data.permissions;
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
  ): Promise<{ message: string; user_id: number; permission_code: string }> => {
    const response = await apiClient.post<{
      message: string;
      user_id: number;
      permission_code: string;
    }>(`/permissions/users/${userId}/overrides`, data);
    return response.data;
  },

  /**
   * Obtiene lista de overrides de un usuario
   * GET /api/v1/permissions/users/:userId/overrides
   * Requiere: usuarios:read
   */
  getUserOverrides: async (userId: number): Promise<UserOverridesResponse> => {
    const response = await apiClient.get<UserOverridesResponse>(
      `/permissions/users/${userId}/overrides`,
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

  /**
   * Obtiene permisos efectivos de un usuario (roles + overrides)
   * GET /api/v1/permissions/users/:userId/effective
   * Requiere: usuarios:read
   */
  getUserEffectivePermissions: async (
    userId: number,
  ): Promise<UserEffectivePermissionsResponse> => {
    const response = await apiClient.get<UserEffectivePermissionsResponse>(
      `/permissions/users/${userId}/effective`,
    );
    return response.data;
  },
};
