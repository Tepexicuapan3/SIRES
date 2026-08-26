import apiClient from "@api/client";
import type {
  OcupacionesListParams,
  OcupacionesListResponse,
  OcupacionDetailResponse,
  CreateOcupacionRequest,
  CreateOcupacionResponse,
  UpdateOcupacionRequest,
  UpdateOcupacionResponse,
  DeleteOcupacionResponse,
} from "@api/types";

export const ocupacionesAPI = {
  getAll: async (params?: OcupacionesListParams): Promise<OcupacionesListResponse> => {
    const response = await apiClient.get<OcupacionesListResponse>("/occupations/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<OcupacionDetailResponse> => {
    const response = await apiClient.get<OcupacionDetailResponse>(`/occupations/${id}/`);
    return response.data;
  },

  create: async (data: CreateOcupacionRequest): Promise<CreateOcupacionResponse> => {
    const response = await apiClient.post<CreateOcupacionResponse>("/occupations/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateOcupacionRequest): Promise<UpdateOcupacionResponse> => {
    const response = await apiClient.put<UpdateOcupacionResponse>(`/occupations/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteOcupacionResponse> => {
    const response = await apiClient.delete<DeleteOcupacionResponse>(`/occupations/${id}/`);
    return response.data;
  },
};
