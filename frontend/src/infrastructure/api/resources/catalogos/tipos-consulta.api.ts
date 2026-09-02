import apiClient from "@api/client";
import type {
  TiposConsultaListParams,
  TiposConsultaListResponse,
  TipoConsultaDetailResponse,
  CreateTipoConsultaRequest,
  CreateTipoConsultaResponse,
  UpdateTipoConsultaRequest,
  UpdateTipoConsultaResponse,
  DeleteTipoConsultaResponse,
} from "@api/types";

export const tiposConsultaAPI = {
  getAll: async (params?: TiposConsultaListParams): Promise<TiposConsultaListResponse> => {
    const response = await apiClient.get<TiposConsultaListResponse>("/consultation-types/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoConsultaDetailResponse> => {
    const response = await apiClient.get<TipoConsultaDetailResponse>(`/consultation-types/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoConsultaRequest): Promise<CreateTipoConsultaResponse> => {
    const response = await apiClient.post<CreateTipoConsultaResponse>("/consultation-types/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoConsultaRequest): Promise<UpdateTipoConsultaResponse> => {
    const response = await apiClient.put<UpdateTipoConsultaResponse>(`/consultation-types/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteTipoConsultaResponse> => {
    const response = await apiClient.delete<DeleteTipoConsultaResponse>(`/consultation-types/${id}/`);
    return response.data;
  },
};
