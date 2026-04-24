import apiClient from "@api/client";
import type {
  TiposAreasListParams,
  TiposAreasListResponse,
  TipoAreaDetailResponse,
  CreateTipoAreaRequest,
  CreateTipoAreaResponse,
  UpdateTipoAreaRequest,
  UpdateTipoAreaResponse,
  DeleteTipoAreaResponse,
} from "@api/types";

export const tiposAreasAPI = {
  getAll: async (params?: TiposAreasListParams): Promise<TiposAreasListResponse> => {
    const response = await apiClient.get<TiposAreasListResponse>("/area-types/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoAreaDetailResponse> => {
    const response = await apiClient.get<TipoAreaDetailResponse>(`/area-types/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoAreaRequest): Promise<CreateTipoAreaResponse> => {
    const response = await apiClient.post<CreateTipoAreaResponse>("/area-types/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoAreaRequest): Promise<UpdateTipoAreaResponse> => {
    const response = await apiClient.put<UpdateTipoAreaResponse>(`/area-types/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteTipoAreaResponse> => {
    const response = await apiClient.delete<DeleteTipoAreaResponse>(`/area-types/${id}/`);
    return response.data;
  },
};
