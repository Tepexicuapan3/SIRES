import apiClient from "@api/client";
import type {
  ConsultorioDetailResponse,
  ConsultoriosListParams,
  ConsultoriosListResponse,
  CreateConsultorioRequest,
  CreateConsultorioResponse,
  DeleteConsultorioResponse,
  UpdateConsultorioRequest,
  UpdateConsultorioResponse,
} from "@api/types";

export const consultoriosAPI = {
  getAll: async (
    params?: ConsultoriosListParams,
  ): Promise<ConsultoriosListResponse> => {
    const response = await apiClient.get<ConsultoriosListResponse>(
      "/consulting-rooms",
      { params },
    );
    return response.data;
  },

  getById: async (
    consultorioId: number,
  ): Promise<ConsultorioDetailResponse> => {
    const response = await apiClient.get<ConsultorioDetailResponse>(
      `/consulting-rooms/${consultorioId}`,
    );
    return response.data;
  },

  create: async (
    data: CreateConsultorioRequest,
  ): Promise<CreateConsultorioResponse> => {
    const response = await apiClient.post<CreateConsultorioResponse>(
      "/consulting-rooms",
      data,
    );
    return response.data;
  },

  update: async (
    consultorioId: number,
    data: UpdateConsultorioRequest,
  ): Promise<UpdateConsultorioResponse> => {
    const response = await apiClient.put<UpdateConsultorioResponse>(
      `/consulting-rooms/${consultorioId}`,
      data,
    );
    return response.data;
  },

  delete: async (consultorioId: number): Promise<DeleteConsultorioResponse> => {
    const response = await apiClient.delete<DeleteConsultorioResponse>(
      `/consulting-rooms/${consultorioId}`,
    );
    return response.data;
  },
};
