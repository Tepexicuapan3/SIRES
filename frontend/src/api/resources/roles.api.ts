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
  RolesListResponse,
  RolesListParams,
  RoleDetailResponse,
  CreateRoleRequest,
  CreateRoleResponse,
  UpdateRoleRequest,
  UpdateRoleResponse,
  AssignPermissionsRequest,
} from "@api/types/roles.types";

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
    // Nota: El backend actualmente retorna { total: number, roles: Role[] }
    // Usamos any temporalmente para adaptar la respuesta al contrato estricto del frontend
    const response = await apiClient.get<any>("/roles", {
      params,
    });

    const data = response.data;

    // Validación defensiva
    if (!data) {
      throw new Error("Respuesta inválida al obtener roles");
    }

    // Adaptador: Si el backend devuelve lista plana ('roles'), la convertimos a estructura paginada
    if (Array.isArray(data.roles)) {
      return {
        items: data.roles,
        total: data.total || data.roles.length,
        page: params?.page || 1,
        page_size: params?.page_size || data.roles.length,
        total_pages: 1 // Asumimos 1 página si no hay metadata real
      };
    }

    // Si ya cumple el formato estándar (items)
    if (Array.isArray(data.items)) {
      return data;
    }

    throw new Error("Formato de respuesta de roles desconocido");
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
    
    if (!response.data || !response.data.role) {
      throw new Error("Rol no encontrado o respuesta inválida");
    }

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
    const response = await apiClient.put<UpdateRoleResponse>(`/roles/${id}`, data);
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
  ): Promise<{ message: string; assigned_count: number }> => {
    // TODO: Idealmente debería ser POST /api/v1/roles/:id/permissions
    const response = await apiClient.post<{
      message: string;
      assigned_count: number;
    }>("/permissions/assign", data);
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