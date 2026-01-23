/**
 * Areas API Resource
 *
 * Endpoints para gestion completa de areas (CRUD).
 * Sigue la estructura de centros de atencion.
 */

import apiClient from "@api/client";
import type {
  AreasListParams,
  AreasListResponse,
  AreaDetailResponse,
  CreateAreaRequest,
  CreateAreaResponse,
  UpdateAreaRequest,
  UpdateAreaResponse,
  DeleteAreaResponse,
} from "@api/types";

export const areasAPI = {
  /**
   * Listar areas con paginacion y filtros.
   * @endpoint GET /api/v1/areas
   * @permission admin:catalogos:areas:read
   */
  getAll: async (params?: AreasListParams): Promise<AreasListResponse> => {
    const response = await apiClient.get<AreasListResponse>("/areas", {
      params,
    });
    return response.data;
  },

  /**
   * Obtener detalle completo de un area.
   * @endpoint GET /api/v1/areas/:id
   * @permission admin:catalogos:areas:read
   */
  getById: async (areaId: number): Promise<AreaDetailResponse> => {
    const response = await apiClient.get<AreaDetailResponse>(
      `/areas/${areaId}`,
    );
    return response.data;
  },

  /**
   * Crear area.
   * @endpoint POST /api/v1/areas
   * @permission admin:catalogos:areas:create
   */
  create: async (data: CreateAreaRequest): Promise<CreateAreaResponse> => {
    const response = await apiClient.post<CreateAreaResponse>("/areas", data);
    return response.data;
  },

  /**
   * Actualizar area.
   * @endpoint PUT /api/v1/areas/:id
   * @permission admin:catalogos:areas:update
   */
  update: async (
    areaId: number,
    data: UpdateAreaRequest,
  ): Promise<UpdateAreaResponse> => {
    const response = await apiClient.put<UpdateAreaResponse>(
      `/areas/${areaId}`,
      data,
    );
    return response.data;
  },

  /**
   * Eliminar area (baja logica).
   * @endpoint DELETE /api/v1/areas/:id
   * @permission admin:catalogos:areas:delete
   */
  delete: async (areaId: number): Promise<DeleteAreaResponse> => {
    const response = await apiClient.delete<DeleteAreaResponse>(
      `/areas/${areaId}`,
    );
    return response.data;
  },
};
