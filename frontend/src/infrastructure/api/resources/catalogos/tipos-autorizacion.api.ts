import apiClient from "@api/client";
import type {
  TiposAutorizacionListParams,
  TiposAutorizacionListResponse,
  TipoAutorizacionDetailResponse,
  CreateTipoAutorizacionRequest,
  CreateTipoAutorizacionResponse,
  UpdateTipoAutorizacionRequest,
  UpdateTipoAutorizacionResponse,
  DeleteTipoAutorizacionResponse,
} from "@api/types";

export const tiposAutorizacionAPI = {
  getAll: async (params?: TiposAutorizacionListParams): Promise<TiposAutorizacionListResponse> => {
    const response = await apiClient.get<TiposAutorizacionListResponse>("/auth-types/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoAutorizacionDetailResponse> => {
    const response = await apiClient.get<TipoAutorizacionDetailResponse>(`/auth-types/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoAutorizacionRequest): Promise<CreateTipoAutorizacionResponse> => {
    const response = await apiClient.post<CreateTipoAutorizacionResponse>("/auth-types/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoAutorizacionRequest): Promise<UpdateTipoAutorizacionResponse> => {
    const response = await apiClient.put<UpdateTipoAutorizacionResponse>(`/auth-types/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteTipoAutorizacionResponse> => {
    const response = await apiClient.delete<DeleteTipoAutorizacionResponse>(`/auth-types/${id}/`);
    return response.data;
  },
};
