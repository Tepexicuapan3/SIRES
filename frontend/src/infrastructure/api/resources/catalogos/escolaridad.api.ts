import apiClient from "@api/client";
import type {
  EscolaridadListParams,
  EscolaridadListResponse,
  EscolaridadDetailResponse,
  CreateEscolaridadRequest,
  CreateEscolaridadResponse,
  UpdateEscolaridadRequest,
  UpdateEscolaridadResponse,
  DeleteEscolaridadResponse,
} from "@api/types";

export const escolaridadAPI = {
  getAll: async (params?: EscolaridadListParams): Promise<EscolaridadListResponse> => {
    const response = await apiClient.get<EscolaridadListResponse>("/education-level/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<EscolaridadDetailResponse> => {
    const response = await apiClient.get<EscolaridadDetailResponse>(`/education-level/${id}`);
    return response.data;
  },

  create: async (data: CreateEscolaridadRequest): Promise<CreateEscolaridadResponse> => {
    const response = await apiClient.post<CreateEscolaridadResponse>("/education-level/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateEscolaridadRequest): Promise<UpdateEscolaridadResponse> => {
    const response = await apiClient.put<UpdateEscolaridadResponse>(`/education-level/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteEscolaridadResponse> => {
    const response = await apiClient.delete<DeleteEscolaridadResponse>(`/education-level/${id}`);
    return response.data;
  },
};
