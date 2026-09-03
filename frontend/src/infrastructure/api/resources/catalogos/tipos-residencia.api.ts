import apiClient from "@api/client";
import type {
  TiposResidenciaListParams,
  TiposResidenciaListResponse,
  TipoResidenciaDetailResponse,
  CreateTipoResidenciaRequest,
  CreateTipoResidenciaResponse,
  UpdateTipoResidenciaRequest,
  UpdateTipoResidenciaResponse,
  DeleteTipoResidenciaResponse,
} from "@api/types";

export const tiposResidenciaAPI = {
  getAll: async (params?: TiposResidenciaListParams): Promise<TiposResidenciaListResponse> => {
    const response = await apiClient.get<TiposResidenciaListResponse>("/residence-types/", { params });
    return response.data;
  },
  getById: async (id: number): Promise<TipoResidenciaDetailResponse> => {
    const response = await apiClient.get<TipoResidenciaDetailResponse>(`/residence-types/${id}/`);
    return response.data;
  },
  create: async (data: CreateTipoResidenciaRequest): Promise<CreateTipoResidenciaResponse> => {
    const response = await apiClient.post<CreateTipoResidenciaResponse>("/residence-types/", data);
    return response.data;
  },
  update: async (id: number, data: UpdateTipoResidenciaRequest): Promise<UpdateTipoResidenciaResponse> => {
    const response = await apiClient.put<UpdateTipoResidenciaResponse>(`/residence-types/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<DeleteTipoResidenciaResponse> => {
    const response = await apiClient.delete<DeleteTipoResidenciaResponse>(`/residence-types/${id}/`);
    return response.data;
  },
};
