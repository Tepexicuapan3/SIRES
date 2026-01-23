/**
 * Centros de Atencion API Resource
 *
 * Endpoints para gestion completa de centros de atencion (CRUD).
 * Incluye clinicas, hospitales y sanatorios.
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
} from "@api/types";

export const centrosAtencionAPI = {
  // ==========================================
  // 1. CORE: CRUD
  // ==========================================

  /**
   * Listar centros de atencion con paginacion y filtros.
   * @endpoint GET /api/v1/care-centers
   * @permission admin:catalogo:centros_atencion:read
   */
  getAll: async (
    params?: CentrosAtencionListParams,
  ): Promise<CentrosAtencionListResponse> => {
    const response = await apiClient.get<CentrosAtencionListResponse>(
      "/care-centers",
      {
        params,
      },
    );
    return response.data;
  },

  /**
   * Obtener detalle completo de un centro de atencion.
   * @endpoint GET /api/v1/care-centers/:id
   * @permission admin:catalogo:centros_atencion:read
   */
  getById: async (centerId: number): Promise<CentroAtencionDetailResponse> => {
    const response = await apiClient.get<CentroAtencionDetailResponse>(
      `/care-centers/${centerId}`,
    );
    return response.data;
  },

  /**
   * Crear centro de atencion.
   * @endpoint POST /api/v1/care-centers
   * @permission admin:catalogo:centros_atencion:create
   */
  create: async (
    data: CreateCentroAtencionRequest,
  ): Promise<CreateCentroAtencionResponse> => {
    const response = await apiClient.post<CreateCentroAtencionResponse>(
      "/care-centers",
      data,
    );
    return response.data;
  },

  /**
   * Actualizar centro de atencion.
   * @endpoint PUT /api/v1/care-centers/:id
   * @permission admin:catalogo:centros_atencion:update
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
   * @endpoint DELETE /api/v1/care-centers/:id
   * @permission admin:catalogo:centros_atencion:delete
   */
  delete: async (centerId: number): Promise<DeleteCentroAtencionResponse> => {
    const response = await apiClient.delete<DeleteCentroAtencionResponse>(
      `/care-centers/${centerId}`,
    );
    return response.data;
  },
};
