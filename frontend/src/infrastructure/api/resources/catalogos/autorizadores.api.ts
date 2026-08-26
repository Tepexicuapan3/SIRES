import apiClient from "@api/client";
import type {
  AutorizadoresListParams,
  AutorizadoresListResponse,
  AutorizadorDetailResponse,
  CreateAutorizadorRequest,
  CreateAutorizadorResponse,
  UpdateAutorizadorRequest,
  UpdateAutorizadorResponse,
  DeleteAutorizadorResponse,
} from "@api/types";

export const autorizadoresAPI = {
  getAll: async (
    params?: AutorizadoresListParams,
  ): Promise<AutorizadoresListResponse> => {
    const response = await apiClient.get<AutorizadoresListResponse>("/authorizers/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<AutorizadorDetailResponse> => {
    const response = await apiClient.get<AutorizadorDetailResponse>(`/authorizers/${id}/`);
    return response.data;
  },

  create: async (data: CreateAutorizadorRequest): Promise<CreateAutorizadorResponse> => {
    const response = await apiClient.post<CreateAutorizadorResponse>("/authorizers/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateAutorizadorRequest): Promise<UpdateAutorizadorResponse> => {
    const response = await apiClient.put<UpdateAutorizadorResponse>(`/authorizers/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteAutorizadorResponse> => {
    const response = await apiClient.delete<DeleteAutorizadorResponse>(`/authorizers/${id}/`);
    return response.data;
  },
};
