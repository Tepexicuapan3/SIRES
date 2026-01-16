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
  Role,
  RoleWithCount,
  CreateRoleRequest,
  CreateRoleResponse,
  UpdateRoleRequest,
  UpdateRoleResponse,
  DeleteRoleResponse,
  RolesListParams,
  RolesListResponse,
  RoleDetailResponse,
  AssignPermissionsRequest,
  AssignPermissionsResponse,
} from "@api/schemas/roles.schema";

export const rolesAPI = {
  /**
   * Listar todos los roles del sistema.
   * Soporta paginación y filtrado.
   *
   * @endpoint GET /api/v1/roles
   * @permission admin:config:roles:read
   *
   * @param params - Filtros de búsqueda
   * @returns Lista de roles con contadores
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
   * @permission admin:config:roles:read
   *
   * @param id - ID del rol
   */
  getRole: async (id: number): Promise<RoleDetailResponse> => {
    const response = await apiClient.get<RoleDetailResponse>(`/roles/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo rol.
   *
   * @endpoint POST /api/v1/roles
   * @permission admin:config:roles:create
   *
   * @param data - Configuración del rol
   */
  createRole: async (data: CreateRoleRequest): Promise<CreateRoleResponse> => {
    const response = await apiClient.post<CreateRoleResponse>("/roles", data);
    return response.data;
  },

  /**
   * Actualizar configuración de un rol.
   * (Nombre, descripción, landing page)
   *
   * @endpoint PUT /api/v1/roles/:id
   * @permission admin:config:roles:update
   *
   * @param id - ID del rol
   * @param data - Campos a modificar
   */
  updateRole: async (
    id: number,
    data: UpdateRoleRequest,
  ): Promise<UpdateRoleResponse> => {
    const response = await apiClient.put<UpdateRoleResponse>(
      `/roles/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * Eliminar un rol (Baja Lógica).
   * Solo permitido si no tiene usuarios activos asignados.
   *
   * @endpoint DELETE /api/v1/roles/:id
   * @permission admin:config:roles:delete
   *
   * @param id - ID del rol
   */
  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },

  // ========== GESTIÓN DE PERMISOS DEL ROL ==========

  /**
   * Actualizar permisos asignados al rol (Bulk).
   * Asigna múltiples permisos en una sola operación transaccional.
   *
   * @endpoint POST /api/v1/permissions/assign
   * @permission admin:config:roles:update
   *
   * @param data - ID del rol y array de IDs de permisos
   */
  assignPermissions: async (
    data: AssignPermissionsRequest,
  ): Promise<AssignPermissionsResponse> => {
    const response = await apiClient.post<AssignPermissionsResponse>(
      "/permissions/assign",
      data,
    );
    return response.data;
  },

  /**
   * Revocar un permiso específico de un rol.
   *
   * @endpoint DELETE /api/v1/permissions/roles/:roleId/permissions/:permissionId
   * @permission admin:config:roles:update
   *
   * @param roleId - ID del rol
   * @param permissionId - ID del permiso a quitar
   */
  revokePermission: async (
    roleId: number,
    permissionId: number,
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/permissions/roles/${roleId}/permissions/${permissionId}`,
    );
    return response.data;
  },
};
