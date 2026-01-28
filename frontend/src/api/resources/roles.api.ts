/**
 * Roles API Resource
 *
 * Gestión centralizada de Roles y sus Permisos.
 *
 * ESTRUCTURA DE PERMISOS:
 * Patrón Granular: ADMIN:CONFIG:ROLES:{ACCION}
 *
 * MEJORAS APLICADAS:
 * 1. Centralización de lógica (Role + Permissions).
 * 2. Adaptador de paginación para consistencia con UI.
 * 3. Documentación estandarizada.
 */

import apiClient from "@api/client";
import type {
  CreateRoleRequest,
  CreateRoleResponse,
  UpdateRoleRequest,
  UpdateRoleResponse,
  RolesListParams,
  RolesListResponse,
  RoleDetailResponse,
  AssignPermissionsRequest,
  AssignPermissionsResponse,
  RevokePermissionsResponse,
} from "@api/types";

export const rolesAPI = {
  /**
   * Listar todos los roles del sistema.
   * Soporta paginación y filtrado.
   *
   * @endpoint GET /api/v1/roles
   * @permission admin:gestion:roles:read
   *
   * @param params - Filtros de búsqueda
   * @returns Lista de roles con contadores
   */
  getAll: async (params?: RolesListParams): Promise<RolesListResponse> => {
    const response = await apiClient.get<RolesListResponse>("/roles", {
      params,
    });
    return response.data;
  },

  /**
   * Compat: alias legacy.
   */
  getRoles: async (params?: RolesListParams): Promise<RolesListResponse> => {
    const response = await apiClient.get<RolesListResponse>("/roles", {
      params,
    });
    return response.data;
  },

  /**
   * Obtener detalle de un rol específico.
   * Incluye la lista de permisos asignados.
   *
   * @endpoint GET /api/v1/roles/:id
   * @permission admin:gestion:roles:read
   *
   * @param roleId - ID del rol
   */
  getById: async (roleId: number): Promise<RoleDetailResponse> => {
    const response = await apiClient.get<RoleDetailResponse>(
      `/roles/${roleId}`,
    );
    return response.data;
  },

  /**
   * Compat: alias legacy.
   */
  getRole: async (roleId: number): Promise<RoleDetailResponse> => {
    const response = await apiClient.get<RoleDetailResponse>(
      `/roles/${roleId}`,
    );
    return response.data;
  },

  /**
   * Crear un nuevo rol.
   *
   * @endpoint POST /api/v1/roles
   * @permission admin:gestion:roles:create
   *
   * @param data - Configuración del rol
   */
  create: async (data: CreateRoleRequest): Promise<CreateRoleResponse> => {
    const response = await apiClient.post<CreateRoleResponse>("/roles", data);
    return response.data;
  },

  /**
   * Compat: alias legacy.
   */
  createRole: async (
    data: CreateRoleRequest & {
      rol?: string;
      desc_rol?: string;
      landing_route?: string;
    },
  ): Promise<CreateRoleResponse> => {
    const payload =
      "rol" in data
        ? {
            name: data.rol ?? "",
            description: data.desc_rol ?? "",
            landingRoute: data.landing_route,
          }
        : data;
    const response = await apiClient.post<CreateRoleResponse>(
      "/roles",
      payload,
    );
    return response.data;
  },

  /**
   * Actualizar configuración de un rol.
   * (Nombre, descripción, landing page)
   *
   * @endpoint PUT /api/v1/roles/:id
   * @permission admin:gestion:roles:update
   *
   * @param roleId - ID del rol
   * @param data - Campos a modificar
   */
  update: async (
    roleId: number,
    data: UpdateRoleRequest,
  ): Promise<UpdateRoleResponse> => {
    const response = await apiClient.put<UpdateRoleResponse>(
      `/roles/${roleId}`,
      data,
    );
    return response.data;
  },

  /**
   * Compat: alias legacy.
   */
  updateRole: async (
    roleId: number,
    data: UpdateRoleRequest & {
      rol?: string;
      desc_rol?: string;
      landing_route?: string;
    },
  ): Promise<UpdateRoleResponse> => {
    const payload =
      "rol" in data || "desc_rol" in data
        ? {
            name: data.rol,
            description: data.desc_rol,
            landingRoute: data.landing_route,
          }
        : data;
    const response = await apiClient.put<UpdateRoleResponse>(
      `/roles/${roleId}`,
      payload,
    );
    return response.data;
  },

  /**
   * Eliminar un rol (Baja Lógica).
   * Solo permitido si no tiene usuarios activos asignados.
   *
   * @endpoint DELETE /api/v1/roles/:id
   * @permission admin:gestion:roles:delete
   *
   * @param roleId - ID del rol
   */
  delete: async (roleId: number): Promise<void> => {
    await apiClient.delete(`/roles/${roleId}`);
  },

  /**
   * Compat: alias legacy.
   */
  deleteRole: async (roleId: number): Promise<void> => {
    await apiClient.delete(`/roles/${roleId}`);
  },

  // ==========================================
  // 2. SUB-RECURSO: PERMISOS
  // ==========================================
  permissions: {
    /**
     * Actualizar permisos asignados al rol (Bulk).
     * Asigna múltiples permisos en una sola operación transaccional.
     *
     * @endpoint POST /api/v1/permissions/assign
     * @permission admin:gestion:roles:update
     *
     * @param data - ID del rol y array de IDs de permisos
     */
    assign: async (
      data: AssignPermissionsRequest,
    ): Promise<AssignPermissionsResponse> => {
      const payload = {
        roleId: data.roleId ?? data.role_id,
        permissionIds: data.permissionIds ?? data.permission_ids ?? [],
      };
      const response = await apiClient.post<AssignPermissionsResponse>(
        "/permissions/assign",
        payload,
      );
      return response.data;
    },

    /**
     * Revocar un permiso específico de un rol.
     *
     * @endpoint DELETE /api/v1/permissions/roles/:roleId/permissions/:permissionId
     * @permission admin:gestion:roles:update
     *
     * @param roleId - ID del rol
     * @param permissionId - ID del permiso a quitar
     */
    revoke: async (
      roleId: number,
      permissionId: number,
    ): Promise<RevokePermissionsResponse> => {
      const response = await apiClient.delete<RevokePermissionsResponse>(
        `/permissions/roles/${roleId}/permissions/${permissionId}`,
      );
      return response.data;
    },
  },

  /**
   * Compat: alias legacy.
   */
  assignPermissions: async (
    data: AssignPermissionsRequest,
  ): Promise<AssignPermissionsResponse> => {
    const payload = {
      roleId: data.roleId ?? data.role_id,
      permissionIds: data.permissionIds ?? data.permission_ids ?? [],
    };
    const response = await apiClient.post<AssignPermissionsResponse>(
      "/permissions/assign",
      payload,
    );
    return response.data;
  },

  /**
   * Compat: alias legacy.
   */
  revokePermission: async (
    roleId: number,
    permissionId: number,
  ): Promise<RevokePermissionsResponse> => {
    const response = await apiClient.delete<RevokePermissionsResponse>(
      `/permissions/roles/${roleId}/permissions/${permissionId}`,
    );
    return response.data;
  },
};
