import apiClient from "@api/client";
import type {
  DiscapacidadesListParams,
  DiscapacidadesListResponse,
  DiscapacidadDetailResponse,
  CreateDiscapacidadRequest,
  CreateDiscapacidadResponse,
  UpdateDiscapacidadRequest,
  UpdateDiscapacidadResponse,
  DeleteDiscapacidadResponse,
} from "@api/types";

export const discapacidadesAPI = {
  getAll: async (params?: DiscapacidadesListParams): Promise<DiscapacidadesListResponse> => {
    const response = await apiClient.get<DiscapacidadesListResponse>("/disabilities/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<DiscapacidadDetailResponse> => {
    const response = await apiClient.get<DiscapacidadDetailResponse>(`/disabilities/${id}/`);
    return response.data;
  },

  create: async (data: CreateDiscapacidadRequest): Promise<CreateDiscapacidadResponse> => {
    const response = await apiClient.post<CreateDiscapacidadResponse>("/disabilities/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateDiscapacidadRequest): Promise<UpdateDiscapacidadResponse> => {
    const response = await apiClient.put<UpdateDiscapacidadResponse>(`/disabilities/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteDiscapacidadResponse> => {
    const response = await apiClient.delete<DeleteDiscapacidadResponse>(`/disabilities/${id}/`);
    return response.data;
  },
};
