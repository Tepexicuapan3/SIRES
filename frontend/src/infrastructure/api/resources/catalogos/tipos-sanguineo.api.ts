import apiClient from "@api/client";
import type {
  TiposSanguineoListParams,
  TiposSanguineoListResponse,
  TipoSanguineoDetailResponse,
  CreateTipoSanguineoRequest,
  CreateTipoSanguineoResponse,
  UpdateTipoSanguineoRequest,
  UpdateTipoSanguineoResponse,
  DeleteTipoSanguineoResponse,
} from "@api/types";

export const tiposSanguineoAPI = {
  getAll: async (params?: TiposSanguineoListParams): Promise<TiposSanguineoListResponse> => {
    const response = await apiClient.get<TiposSanguineoListResponse>("/blood-type/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoSanguineoDetailResponse> => {
    const response = await apiClient.get<TipoSanguineoDetailResponse>(`/blood-type/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoSanguineoRequest): Promise<CreateTipoSanguineoResponse> => {
    const response = await apiClient.post<CreateTipoSanguineoResponse>("/blood-type/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoSanguineoRequest): Promise<UpdateTipoSanguineoResponse> => {
    const response = await apiClient.put<UpdateTipoSanguineoResponse>(`/blood-type/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteTipoSanguineoResponse> => {
    const response = await apiClient.delete<DeleteTipoSanguineoResponse>(`/blood-type/${id}/`);
    return response.data;
  },
};
