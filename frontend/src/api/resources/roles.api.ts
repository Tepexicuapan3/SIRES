/**
 * Roles API Resource
 *
 * Handles all role-related API calls for RBAC 2.0
 */

import apiClient from "@api/client";
import type {
  Role,
  RoleWithCount,
  RolesListResponse,
  RoleDetailResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleResponse,
  AssignPermissionsRequest,
} from "@api/types/roles.types";

export const rolesAPI = {
  /**
   * Lista todos los roles con count de permisos
   * GET /api/v1/roles
   * Requiere: roles:read
   */
  getRoles: async (): Promise<RoleWithCount[]> => {
    const response = await apiClient.get<RoleWithCount[]>("/roles");
    return response.data;
  },

  /**
   * Obtiene detalle de un rol específico
   * GET /api/v1/roles/:id
   * Requiere: roles:read
   */
  getRole: async (id: number): Promise<RoleDetailResponse> => {
    const response = await apiClient.get<RoleDetailResponse>(`/roles/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo rol
   * POST /api/v1/roles
   * Requiere: roles:create
   */
  createRole: async (data: CreateRoleRequest): Promise<RoleResponse> => {
    const response = await apiClient.post<RoleResponse>("/roles", data);
    return response.data;
  },

  /**
   * Actualiza un rol existente
   * PUT /api/v1/roles/:id
   * Requiere: roles:update
   *
   * NOTA: No permite editar roles del sistema (id_rol <= 22)
   */
  updateRole: async (
    id: number,
    data: UpdateRoleRequest,
  ): Promise<RoleResponse> => {
    const response = await apiClient.put<RoleResponse>(`/roles/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un rol
   * DELETE /api/v1/roles/:id
   * Requiere: roles:delete
   *
   * NOTA:
   * - No permite eliminar roles del sistema (id_rol <= 22)
   * - No permite eliminar roles con usuarios asignados
   */
  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },

  /**
   * Asigna múltiples permisos a un rol
   * POST /api/v1/permissions/assign
   * Requiere: permisos:assign
   */
  assignPermissions: async (
    data: AssignPermissionsRequest,
  ): Promise<{ message: string; assigned_count: number }> => {
    const response = await apiClient.post<{
      message: string;
      assigned_count: number;
    }>("/permissions/assign", data);
    return response.data;
  },

  /**
   * Revoca un permiso de un rol
   * DELETE /api/v1/permissions/roles/:roleId/permissions/:permissionId
   * Requiere: permisos:assign
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
