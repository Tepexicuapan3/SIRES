import apiClient from "@api/client";
import type {
  SucursalesListParams,
  SucursalesListResponse,
  SucursalDetailResponse,
  CreateSucursalRequest,
  CreateSucursalResponse,
  UpdateSucursalRequest,
  UpdateSucursalResponse,
  DeleteSucursalResponse,
} from "@api/types";

export const sucursalesAPI = {
  getAll: async (params?: SucursalesListParams): Promise<SucursalesListResponse> => {
    const response = await apiClient.get<SucursalesListResponse>("/branches/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<SucursalDetailResponse> => {
    const response = await apiClient.get<SucursalDetailResponse>(`/branches/${id}/`);
    return response.data;
  },

  create: async (data: CreateSucursalRequest): Promise<CreateSucursalResponse> => {
    const response = await apiClient.post<CreateSucursalResponse>("/branches/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateSucursalRequest): Promise<UpdateSucursalResponse> => {
    const response = await apiClient.put<UpdateSucursalResponse>(`/branches/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteSucursalResponse> => {
    const response = await apiClient.delete<DeleteSucursalResponse>(`/branches/${id}/`);
    return response.data;
  },
};
