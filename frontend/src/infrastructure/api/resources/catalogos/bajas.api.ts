import apiClient from "@api/client";
import type {
  BajasListParams,
  BajasListResponse,
  BajaDetailResponse,
  CreateBajaRequest,
  CreateBajaResponse,
  UpdateBajaRequest,
  UpdateBajaResponse,
  DeleteBajaResponse,
} from "@api/types";

export const bajasAPI = {
  getAll: async (params?: BajasListParams): Promise<BajasListResponse> => {
    const response = await apiClient.get<BajasListResponse>("/discharge-reasons/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<BajaDetailResponse> => {
    const response = await apiClient.get<BajaDetailResponse>(`/discharge-reasons/${id}/`);
    return response.data;
  },

  create: async (data: CreateBajaRequest): Promise<CreateBajaResponse> => {
    const response = await apiClient.post<CreateBajaResponse>("/discharge-reasons/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateBajaRequest): Promise<UpdateBajaResponse> => {
    const response = await apiClient.put<UpdateBajaResponse>(`/discharge-reasons/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteBajaResponse> => {
    const response = await apiClient.delete<DeleteBajaResponse>(`/discharge-reasons/${id}/`);
    return response.data;
  },
};
