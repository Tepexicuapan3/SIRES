import apiClient from "@api/client";
import type {
  TipoPersonalListParams,
  TipoPersonalListResponse,
  TipoPersonalDetailResponse,
  CreateTipoPersonalRequest,
  CreateTipoPersonalResponse,
  UpdateTipoPersonalRequest,
  UpdateTipoPersonalResponse,
  DeleteTipoPersonalResponse,
} from "@api/types";

export const tipoPersonalAPI = {
  getAll: async (params?: TipoPersonalListParams): Promise<TipoPersonalListResponse> => {
    const response = await apiClient.get<TipoPersonalListResponse>("/personal-types/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoPersonalDetailResponse> => {
    const response = await apiClient.get<TipoPersonalDetailResponse>(`/personal-types/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoPersonalRequest): Promise<CreateTipoPersonalResponse> => {
    const response = await apiClient.post<CreateTipoPersonalResponse>("/personal-types/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoPersonalRequest): Promise<UpdateTipoPersonalResponse> => {
    const response = await apiClient.put<UpdateTipoPersonalResponse>(`/personal-types/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteTipoPersonalResponse> => {
    const response = await apiClient.delete<DeleteTipoPersonalResponse>(`/personal-types/${id}/`);
    return response.data;
  },
};
