import apiClient from "@api/client";
import type {
  SucursalesListParams,
  SucursalesListResponse,
  CreateSucursalRequest,
  CreateSucursalResponse,
} from "@api/types";

export const sucursalesAPI = {
  getAll: async (params?: SucursalesListParams): Promise<SucursalesListResponse> => {
    const response = await apiClient.get<SucursalesListResponse>("/branches/", { params });
    return response.data;
  },

  create: async (data: CreateSucursalRequest): Promise<CreateSucursalResponse> => {
    const response = await apiClient.post<CreateSucursalResponse>("/branches/", data);
    return response.data;
  },
};
