import apiClient from "@api/client";
import type {
  EnfermedadesListParams,
  EnfermedadesListResponse,
  EnfermedadDetailResponse,
  CreateEnfermedadRequest,
  CreateEnfermedadResponse,
  UpdateEnfermedadRequest,
  UpdateEnfermedadResponse,
  DeleteEnfermedadResponse,
} from "@api/types";

export const enfermedadesAPI = {
  getAll: async (params?: EnfermedadesListParams): Promise<EnfermedadesListResponse> => {
    const response = await apiClient.get<EnfermedadesListResponse>("/diseases/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<EnfermedadDetailResponse> => {
    const response = await apiClient.get<EnfermedadDetailResponse>(`/diseases/${id}/`);
    return response.data;
  },

  create: async (data: CreateEnfermedadRequest): Promise<CreateEnfermedadResponse> => {
    const response = await apiClient.post<CreateEnfermedadResponse>("/diseases/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateEnfermedadRequest): Promise<UpdateEnfermedadResponse> => {
    const response = await apiClient.put<UpdateEnfermedadResponse>(`/diseases/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteEnfermedadResponse> => {
    const response = await apiClient.delete<DeleteEnfermedadResponse>(`/diseases/${id}/`);
    return response.data;
  },
};
