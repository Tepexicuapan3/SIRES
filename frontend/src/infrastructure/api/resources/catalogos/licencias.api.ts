import apiClient from "@api/client";
import type {
  LicenciasListParams,
  LicenciasListResponse,
  LicenciaDetailResponse,
  CreateLicenciaRequest,
  CreateLicenciaResponse,
  UpdateLicenciaRequest,
  UpdateLicenciaResponse,
  DeleteLicenciaResponse,
} from "@api/types";

export const licenciasAPI = {
  getAll: async (params?: LicenciasListParams): Promise<LicenciasListResponse> => {
    const response = await apiClient.get<LicenciasListResponse>("/licenses/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<LicenciaDetailResponse> => {
    const response = await apiClient.get<LicenciaDetailResponse>(`/licenses/${id}/`);
    return response.data;
  },

  create: async (data: CreateLicenciaRequest): Promise<CreateLicenciaResponse> => {
    const response = await apiClient.post<CreateLicenciaResponse>("/licenses/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateLicenciaRequest): Promise<UpdateLicenciaResponse> => {
    const response = await apiClient.put<UpdateLicenciaResponse>(`/licenses/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteLicenciaResponse> => {
    const response = await apiClient.delete<DeleteLicenciaResponse>(`/licenses/${id}/`);
    return response.data;
  },
};
