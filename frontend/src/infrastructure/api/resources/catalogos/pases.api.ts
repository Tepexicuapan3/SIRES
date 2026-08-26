import apiClient from "@api/client";
import type {
  PasesListParams,
  PasesListResponse,
  PaseDetailResponse,
  CreatePaseRequest,
  CreatePaseResponse,
  UpdatePaseRequest,
  UpdatePaseResponse,
  DeletePaseResponse,
} from "@api/types";

export const pasesAPI = {
  getAll: async (params?: PasesListParams): Promise<PasesListResponse> => {
    const response = await apiClient.get<PasesListResponse>("/passes/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<PaseDetailResponse> => {
    const response = await apiClient.get<PaseDetailResponse>(`/passes/${id}/`);
    return response.data;
  },

  create: async (data: CreatePaseRequest): Promise<CreatePaseResponse> => {
    const response = await apiClient.post<CreatePaseResponse>("/passes/", data);
    return response.data;
  },

  update: async (id: number, data: UpdatePaseRequest): Promise<UpdatePaseResponse> => {
    const response = await apiClient.put<UpdatePaseResponse>(`/passes/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeletePaseResponse> => {
    const response = await apiClient.delete<DeletePaseResponse>(`/passes/${id}/`);
    return response.data;
  },
};
