import apiClient from "@api/client";
import type {
  EscuelasListParams,
  EscuelasListResponse,
  EscuelaDetailResponse,
  CreateEscuelaRequest,
  CreateEscuelaResponse,
  UpdateEscuelaRequest,
  UpdateEscuelaResponse,
  DeleteEscuelaResponse,
} from "@api/types";

export const escuelasAPI = {
  getAll: async (params?: EscuelasListParams): Promise<EscuelasListResponse> => {
    const response = await apiClient.get<EscuelasListResponse>("/schools/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<EscuelaDetailResponse> => {
    const response = await apiClient.get<EscuelaDetailResponse>(`/schools/${id}/`);
    return response.data;
  },

  create: async (data: CreateEscuelaRequest): Promise<CreateEscuelaResponse> => {
    const response = await apiClient.post<CreateEscuelaResponse>("/schools/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateEscuelaRequest): Promise<UpdateEscuelaResponse> => {
    const response = await apiClient.put<UpdateEscuelaResponse>(`/schools/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteEscuelaResponse> => {
    const response = await apiClient.delete<DeleteEscuelaResponse>(`/schools/${id}/`);
    return response.data;
  },
};
