import apiClient from "@api/client";
import type {
  ParentescoListParams,
  ParentescoListResponse,
  ParentescoDetailResponse,
  CreateParentescoRequest,
  CreateParentescoResponse,
  UpdateParentescoRequest,
  UpdateParentescoResponse,
  DeleteParentescoResponse,
} from "@api/types";

export const parentescoAPI = {
  getAll: async (
    params?: ParentescoListParams,
  ): Promise<ParentescoListResponse> => {
    const response = await apiClient.get<ParentescoListResponse>("/kinship/", { params });
    return response.data;
  },

  getById: async (id: string): Promise<ParentescoDetailResponse> => {
    const response = await apiClient.get<ParentescoDetailResponse>(`/kinship/${id}/`);
    return response.data;
  },

  create: async (
    data: CreateParentescoRequest,
  ): Promise<CreateParentescoResponse> => {
    const response = await apiClient.post<CreateParentescoResponse>("/kinship/", data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateParentescoRequest,
  ): Promise<UpdateParentescoResponse> => {
    const response = await apiClient.put<UpdateParentescoResponse>(`/kinship/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<DeleteParentescoResponse> => {
    const response = await apiClient.delete<DeleteParentescoResponse>(`/kinship/${id}/`);
    return response.data;
  },
};
