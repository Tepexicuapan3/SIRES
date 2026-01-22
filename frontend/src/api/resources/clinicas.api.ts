/**
 * Clinicas API Resource
 *
 * Endpoints para gestión completa de clínicas (CRUD).
 * Las clínicas son puntos de atención médica del Metro CDMX.
 */

import apiClient from "@api/client";
import type {
  ClinicsListParams,
  ClinicsListResponse,
  ClinicDetailResponse,
  CreateClinicRequest,
  CreateClinicResponse,
  UpdateClinicRequest,
  UpdateClinicResponse,
  DeleteClinicResponse,
} from "@api/types";

export const clinicasAPI = {
  // ==========================================
  // 1. CORE: CRUD
  // ==========================================

  /**
   * Listar clínicas con paginación y filtros.
   * @endpoint GET /api/v1/clinics
   * @permission admin:gestion:clinicas:read
   */
  getAll: async (params?: ClinicsListParams): Promise<ClinicsListResponse> => {
    const response = await apiClient.get<ClinicsListResponse>("/clinics", {
      params,
    });
    return response.data;
  },

  /**
   * Obtener detalle completo de una clínica.
   * @endpoint GET /api/v1/clinics/:id
   * @permission admin:gestion:clinicas:read
   */
  getById: async (clinicId: number): Promise<ClinicDetailResponse> => {
    const response = await apiClient.get<ClinicDetailResponse>(
      `/clinics/${clinicId}`,
    );
    return response.data;
  },

  /**
   * Crear clínica.
   * @endpoint POST /api/v1/clinics
   * @permission admin:gestion:clinicas:create
   */
  create: async (data: CreateClinicRequest): Promise<CreateClinicResponse> => {
    const response = await apiClient.post<CreateClinicResponse>(
      "/clinics",
      data,
    );
    return response.data;
  },

  /**
   * Actualizar clínica.
   * @endpoint PUT /api/v1/clinics/:id
   * @permission admin:gestion:clinicas:update
   */
  update: async (
    clinicId: number,
    data: UpdateClinicRequest,
  ): Promise<UpdateClinicResponse> => {
    const response = await apiClient.put<UpdateClinicResponse>(
      `/clinics/${clinicId}`,
      data,
    );
    return response.data;
  },

  /**
   * Eliminar clínica (baja lógica).
   * @endpoint DELETE /api/v1/clinics/:id
   * @permission admin:gestion:clinicas:delete
   */
  delete: async (clinicId: number): Promise<DeleteClinicResponse> => {
    const response = await apiClient.delete<DeleteClinicResponse>(
      `/clinics/${clinicId}`,
    );
    return response.data;
  },
};
