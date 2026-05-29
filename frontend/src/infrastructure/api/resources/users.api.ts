/**
 * Users API Resource
 *
 * Gestión completa de usuarios dividida en sub-recursos lógicos.
 *
 * ESTRUCTURA:
 * - Core: CRUD básico de perfil y estados.
 * - Roles: Gestión de roles asignados.
 * - Overrides: Gestión de excepciones de permisos.
 *
 * PERMISOS:
 * Patrón: ADMIN:GESTION:USUARIOS:{ACCION}
 */

import apiClient from "@api/client";
import type {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UserStatusResponse,
  UsersListParams,
  UsersListResponse,
  UserDetailResponse,
  AssignRolesRequest,
  AssignRolesResponse,
  SetPrimaryRoleRequest,
  SetPrimaryRoleResponse,
  RevokeRoleResponse,
  AddUserOverrideRequest,
  AddUserOverrideResponse,
  RemoveUserOverrideResponse,
  EmpleadoSermedResponse,
  NotifyUsersRequest,
  NotifyUsersResponse,
  NotifyUsersPreviewResponse,
} from "@api/types";

export const usersAPI = {
  // ==========================================
  // 1. CORE: PERFIL Y ESTADOS
  // ==========================================

  /**
   * Listar usuarios con paginación.
   * @endpoint GET /api/v1/users
   * @permission admin:gestion:usuarios:read
   */
  getAll: async (params?: UsersListParams): Promise<UsersListResponse> => {
    const response = await apiClient.get<UsersListResponse>("/users", {
      params,
    });
    return response.data;
  },

  /**
   * Compat: alias legacy.
   */
  getUsers: async (params?: UsersListParams): Promise<UsersListResponse> => {
    const response = await apiClient.get<UsersListResponse>("/users", {
      params,
    });
    return response.data;
  },

  /**
   * Obtener detalle completo (Perfil + Roles + Overrides).
   * @endpoint GET /api/v1/users/:id
   * @permission admin:gestion:usuarios:read
   */
  getById: async (userId: number): Promise<UserDetailResponse> => {
    const response = await apiClient.get<UserDetailResponse>(
      `/users/${userId}`,
    );
    return response.data;
  },

  /**
   * Crear usuario.
   * @endpoint POST /api/v1/users
   * @permission admin:gestion:usuarios:create
   */
  create: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await apiClient.post<CreateUserResponse>("/users", data);
    return response.data;
  },

  /**
   * Actualizar perfil básico.
   * @endpoint PATCH /api/v1/users/:id
   * @permission admin:gestion:usuarios:update
   */
  update: async (
    userId: number,
    data: UpdateUserRequest,
  ): Promise<UpdateUserResponse> => {
    const response = await apiClient.patch<UpdateUserResponse>(
      `/users/${userId}`,
      data,
    );
    return response.data;
  },

  /**
   * Activar usuario.
   * @endpoint PATCH /api/v1/users/:id/activate
   * @permission admin:gestion:usuarios:update
   */
  activate: async (userId: number): Promise<UserStatusResponse> => {
    const response = await apiClient.patch<UserStatusResponse>(
      `/users/${userId}/activate`,
    );
    return response.data;
  },

  /**
   * Desactivar usuario.
   * @endpoint PATCH /api/v1/users/:id/deactivate
   * @permission admin:gestion:usuarios:update
   */
  deactivate: async (userId: number): Promise<UserStatusResponse> => {
    const response = await apiClient.patch<UserStatusResponse>(
      `/users/${userId}/deactivate`,
    );
    return response.data;
  },

  /**
   * Buscar empleado en SERMED por número de expediente.
   * @endpoint GET /api/v1/users/empleados-sermed/:noExp
   * @permission admin:gestion:usuarios:read
   */
  lookupEmpleadoSermed: async (
    noExp: string,
  ): Promise<EmpleadoSermedResponse> => {
    const response = await apiClient.get<EmpleadoSermedResponse>(
      `/users/empleados-sermed/${encodeURIComponent(noExp)}`,
    );
    return response.data;
  },

  /**
   * Valores distintos de cd_laboral registrados en el sistema.
   * @endpoint GET /api/v1/users/cd-laborales
   */
  getCdLaborales: async (): Promise<{ items: string[] }> => {
    const response = await apiClient.get<{ items: string[] }>("/users/cd-laborales");
    return response.data;
  },

  /**
   * Exportar usuarios a Excel con los filtros actuales.
   * @endpoint GET /api/v1/users/export
   * @permission admin:gestion:usuarios:read
   */
  export: async (params?: UsersListParams): Promise<Blob> => {
    const response = await apiClient.get("/users/export", {
      params,
      responseType: "blob",
    });
    return response.data as Blob;
  },

  /**
   * Vista previa: cuántos usuarios recibirían la notificación.
   * @endpoint POST /api/v1/users/notify?preview=true
   */
  notifyPreview: async (data: NotifyUsersRequest): Promise<NotifyUsersPreviewResponse> => {
    const response = await apiClient.post<NotifyUsersPreviewResponse>(
      "/users/notify?preview=true",
      data,
    );
    return response.data;
  },

  /**
   * Enviar notificación masiva con adjuntos opcionales.
   * - Sin adjuntos → JSON
   * - Con adjuntos  → multipart/form-data (DRF acepta ambos)
   * @endpoint POST /api/v1/users/notify
   * @permission admin:gestion:usuarios:update
   */
  notify: async (data: NotifyUsersRequest, files?: File[]): Promise<NotifyUsersResponse> => {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("subject", data.subject);
      formData.append("message", data.message);
      if (data.category) formData.append("category", data.category);
      if (data.cdLaboral) formData.append("cdLaboral", data.cdLaboral);
      if (data.userId != null) formData.append("userId", String(data.userId));
      if (data.clinicId != null) formData.append("clinicId", String(data.clinicId));
      files.forEach((file) => formData.append("attachments", file));
      // Eliminar Content-Type del default (application/json) para que el browser
      // genere automáticamente "multipart/form-data; boundary=..." con el FormData.
      // Sin esto DRF recibe Content-Type: application/json → usa JSONParser → request.FILES vacío.
      const response = await apiClient.post<NotifyUsersResponse>("/users/notify", formData, {
        headers: { "Content-Type": undefined },
      });
      return response.data;
    }
    const response = await apiClient.post<NotifyUsersResponse>("/users/notify", data);
    return response.data;
  },

  // ==========================================
  // 2. SUB-RECURSO: ROLES
  // ==========================================
  roles: {
    /**
     * Asignar roles adicionales.
     * @endpoint POST /api/v1/users/:id/roles
     * @permission admin:gestion:usuarios:update
     */
    assign: async (
      userId: number,
      data: AssignRolesRequest,
    ): Promise<AssignRolesResponse> => {
      const response = await apiClient.post<AssignRolesResponse>(
        `/users/${userId}/roles`,
        data,
      );
      return response.data;
    },

    /**
     * Establecer rol primario.
     * @endpoint PUT /api/v1/users/:id/roles/primary
     * @permission admin:gestion:usuarios:update
     */
    setPrimary: async (
      userId: number,
      data: SetPrimaryRoleRequest,
    ): Promise<SetPrimaryRoleResponse> => {
      const response = await apiClient.put<SetPrimaryRoleResponse>(
        `/users/${userId}/roles/primary`,
        data,
      );
      return response.data;
    },

    /**
     * Revocar rol secundario.
     * @endpoint DELETE /api/v1/users/:id/roles/:roleId
     * @permission admin:gestion:usuarios:update
     */
    revoke: async (
      userId: number,
      roleId: number,
    ): Promise<RevokeRoleResponse> => {
      const response = await apiClient.delete<RevokeRoleResponse>(
        `/users/${userId}/roles/${roleId}`,
      );
      return response.data;
    },
  },

  // ==========================================
  // 3. SUB-RECURSO: OVERRIDES (Permisos)
  // ==========================================
  overrides: {
    /**
     * Agregar excepción (Allow/Deny).
     * @endpoint POST /api/v1/users/:id/overrides
     * @permission admin:gestion:usuarios:update
     */
    add: async (
      userId: number,
      data: AddUserOverrideRequest,
    ): Promise<AddUserOverrideResponse> => {
      const response = await apiClient.post<AddUserOverrideResponse>(
        `/users/${userId}/overrides`,
        data,
      );
      return response.data;
    },

    /**
     * Eliminar excepción.
     * @endpoint DELETE /api/v1/users/:id/overrides/:code
     * @permission admin:gestion:usuarios:update
     */
    remove: async (
      userId: number,
      permissionCode: string,
    ): Promise<RemoveUserOverrideResponse> => {
      const response = await apiClient.delete<RemoveUserOverrideResponse>(
        `/users/${userId}/overrides/${permissionCode}`,
      );
      return response.data;
    },
  },
};
