import apiClient from "@api/client";
import type {
  CalidadLaboralListParams,
  CalidadLaboralListResponse,
  CalidadLaboralDetailResponse,
  CreateCalidadLaboralRequest,
  CreateCalidadLaboralResponse,
  UpdateCalidadLaboralRequest,
  UpdateCalidadLaboralResponse,
  DeleteCalidadLaboralResponse,
} from "@api/types";

export const calidadLaboralAPI = {
  getAll: async (
    params?: CalidadLaboralListParams,
  ): Promise<CalidadLaboralListResponse> => {
    const response = await apiClient.get<CalidadLaboralListResponse>("/labor-quality/", { params });
    return response.data;
  },

  getById: async (id: string): Promise<CalidadLaboralDetailResponse> => {
    const response = await apiClient.get<CalidadLaboralDetailResponse>(`/labor-quality/${id}/`);
    return response.data;
  },

  create: async (
    data: CreateCalidadLaboralRequest,
  ): Promise<CreateCalidadLaboralResponse> => {
    const response = await apiClient.post<CreateCalidadLaboralResponse>("/labor-quality/", data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateCalidadLaboralRequest,
  ): Promise<UpdateCalidadLaboralResponse> => {
    const response = await apiClient.put<UpdateCalidadLaboralResponse>(`/labor-quality/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<DeleteCalidadLaboralResponse> => {
    const response = await apiClient.delete<DeleteCalidadLaboralResponse>(`/labor-quality/${id}/`);
    return response.data;
  },
};
