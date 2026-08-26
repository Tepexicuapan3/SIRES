import apiClient from "@api/client";
import type {
  OrigenConsultaListParams,
  OrigenConsultaListResponse,
  OrigenConsultaDetailResponse,
  CreateOrigenConsultaRequest,
  CreateOrigenConsultaResponse,
  UpdateOrigenConsultaRequest,
  UpdateOrigenConsultaResponse,
  DeleteOrigenConsultaResponse,
} from "@api/types";

export const origenConsultaAPI = {
  getAll: async (
    params?: OrigenConsultaListParams,
  ): Promise<OrigenConsultaListResponse> => {
    const response = await apiClient.get<OrigenConsultaListResponse>("/consultation-origins/", { params });
    return response.data;
  },

  getById: async (id: string): Promise<OrigenConsultaDetailResponse> => {
    const response = await apiClient.get<OrigenConsultaDetailResponse>(`/consultation-origins/${id}/`);
    return response.data;
  },

  create: async (
    data: CreateOrigenConsultaRequest,
  ): Promise<CreateOrigenConsultaResponse> => {
    const response = await apiClient.post<CreateOrigenConsultaResponse>("/consultation-origins/", data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateOrigenConsultaRequest,
  ): Promise<UpdateOrigenConsultaResponse> => {
    const response = await apiClient.put<UpdateOrigenConsultaResponse>(`/consultation-origins/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<DeleteOrigenConsultaResponse> => {
    const response = await apiClient.delete<DeleteOrigenConsultaResponse>(`/consultation-origins/${id}/`);
    return response.data;
  },
};
