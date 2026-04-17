/**
 * Centros de Atencion API Resource
 *
 * Endpoints:
 * - GET    /care-centers/
 * - POST   /care-centers/
 * - GET    /care-centers/:id
 * - PUT    /care-centers/:id
 * - DELETE /care-centers/:id
 *
 * Relacionados:
 * - GET    /care-center-schedules/
 * - POST   /care-center-schedules/
 * - GET    /care-center-schedules/:id
 * - PUT    /care-center-schedules/:id
 * - DELETE /care-center-schedules/:id
 *
 * - GET    /postal-codes/search/?cp=01000
 */

import apiClient from "@api/client";
import type {
  CentrosAtencionListParams,
  CentrosAtencionListResponse,
  CentroAtencionDetailResponse,
  CreateCentroAtencionRequest,
  CreateCentroAtencionResponse,
  UpdateCentroAtencionRequest,
  UpdateCentroAtencionResponse,
  DeleteCentroAtencionResponse,
  CentrosAtencionHorariosListParams,
  CentrosAtencionHorariosListResponse,
  CentroAtencionHorarioDetailResponse,
  CreateCentroAtencionHorarioRequest,
  CreateCentroAtencionHorarioResponse,
  UpdateCentroAtencionHorarioRequest,
  UpdateCentroAtencionHorarioResponse,
  DeleteCentroAtencionHorarioResponse,
  PostalCodeSearchResponse,
} from "@api/types";

export const centrosAtencionAPI = {
  // ==========================================
  // 1. CENTROS DE ATENCION
  // ==========================================

  /**
   * Listar centros de atencion con paginacion y filtros.
   * @endpoint GET /care-centers/
   * @permission admin:catalogos:centros_atencion:read
   */
  getAll: async (
    params?: CentrosAtencionListParams,
  ): Promise<CentrosAtencionListResponse> => {
    const response = await apiClient.get<CentrosAtencionListResponse>(
      "/care-centers/",
      { params },
    );
    return response.data;
  },

  /**
   * Obtener detalle completo de un centro de atencion.
   * @endpoint GET /care-centers/:id
   * @permission admin:catalogos:centros_atencion:read
   */
  getById: async (centerId: number): Promise<CentroAtencionDetailResponse> => {
    const response = await apiClient.get<CentroAtencionDetailResponse>(
      `/care-centers/${centerId}`,
    );
    return response.data;
  },

  /**
   * Crear centro de atencion.
   * @endpoint POST /care-centers/
   * @permission admin:catalogos:centros_atencion:create
   */
  create: async (
    data: CreateCentroAtencionRequest,
  ): Promise<CreateCentroAtencionResponse> => {
    const response = await apiClient.post<CreateCentroAtencionResponse>(
      "/care-centers/",
      data,
    );
    return response.data;
  },

  /**
   * Actualizar centro de atencion.
   * @endpoint PUT /care-centers/:id
   * @permission admin:catalogos:centros_atencion:update
   */
  update: async (
    centerId: number,
    data: UpdateCentroAtencionRequest,
  ): Promise<UpdateCentroAtencionResponse> => {
    const response = await apiClient.put<UpdateCentroAtencionResponse>(
      `/care-centers/${centerId}`,
      data,
    );
    return response.data;
  },

  /**
   * Eliminar centro de atencion (baja logica).
   * @endpoint DELETE /care-centers/:id
   * @permission admin:catalogos:centros_atencion:delete
   */
  delete: async (centerId: number): Promise<DeleteCentroAtencionResponse> => {
    const response = await apiClient.delete<DeleteCentroAtencionResponse>(
      `/care-centers/${centerId}`,
    );
    return response.data;
  },

  // ==========================================
  // 2. HORARIOS DE CENTROS DE ATENCION
  // ==========================================

  /**
   * Listar horarios de centros.
   * @endpoint GET /care-center-schedules/
   * @permission admin:catalogos:centros_atencion_horarios:read
   */
  getSchedules: async (
    params?: CentrosAtencionHorariosListParams,
  ): Promise<CentrosAtencionHorariosListResponse> => {
    const response = await apiClient.get<CentrosAtencionHorariosListResponse>(
      "/care-center-schedules/",
      { params },
    );
    return response.data;
  },

  /**
   * Obtener detalle de un horario.
   * @endpoint GET /care-center-schedules/:id
   * @permission admin:catalogos:centros_atencion_horarios:read
   */
  getScheduleById: async (
    scheduleId: number,
  ): Promise<CentroAtencionHorarioDetailResponse> => {
    const response = await apiClient.get<CentroAtencionHorarioDetailResponse>(
      `/care-center-schedules/${scheduleId}`,
    );
    return response.data;
  },

  /**
   * Crear horario.
   * @endpoint POST /care-center-schedules/
   * @permission admin:catalogos:centros_atencion_horarios:create
   */
  createSchedule: async (
    data: CreateCentroAtencionHorarioRequest,
  ): Promise<CreateCentroAtencionHorarioResponse> => {
    const response = await apiClient.post<CreateCentroAtencionHorarioResponse>(
      "/care-center-schedules/",
      data,
    );
    return response.data;
  },

  /**
   * Actualizar horario.
   * @endpoint PUT /care-center-schedules/:id
   * @permission admin:catalogos:centros_atencion_horarios:update
   */
  updateSchedule: async (
    scheduleId: number,
    data: UpdateCentroAtencionHorarioRequest,
  ): Promise<UpdateCentroAtencionHorarioResponse> => {
    const response = await apiClient.put<UpdateCentroAtencionHorarioResponse>(
      `/care-center-schedules/${scheduleId}`,
      data,
    );
    return response.data;
  },

  /**
   * Eliminar horario (baja logica).
   * @endpoint DELETE /care-center-schedules/:id
   * @permission admin:catalogos:centros_atencion_horarios:delete
   */
  deleteSchedule: async (
    scheduleId: number,
  ): Promise<DeleteCentroAtencionHorarioResponse> => {
    const response = await apiClient.delete<DeleteCentroAtencionHorarioResponse>(
      `/care-center-schedules/${scheduleId}`,
    );
    return response.data;
  },

  // ==========================================
  // 3. CODIGOS POSTALES
  // ==========================================

  /**
   * Buscar informacion de codigo postal desde TXT.
   * @endpoint GET /postal-codes/search/?cp=01000
   * @permission admin:catalogos:centros_atencion:read
   */
  searchPostalCode: async (cp: string): Promise<PostalCodeSearchResponse> => {
    const response = await apiClient.get<PostalCodeSearchResponse>(
      "/postal-codes/search/",
      {
        params: { cp },
      },
    );
    return response.data;
  },
};