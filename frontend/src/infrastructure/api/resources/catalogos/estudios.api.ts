import apiClient from "@api/client";
import type {
  EstudiosListParams,
  EstudiosListResponse,
  EstudioDetailResponse,
  CreateEstudioRequest,
  CreateEstudioResponse,
  UpdateEstudioRequest,
  UpdateEstudioResponse,
  DeleteEstudioResponse,
} from "@api/types";

export const estudiosAPI = {
  getAll: async (
    params?: EstudiosListParams,
  ): Promise<EstudiosListResponse> => {
    const response = await apiClient.get<EstudiosListResponse>("/estudios/", {
      params,
    });
    return response.data;
  },

  getById: async (id: number): Promise<EstudioDetailResponse> => {
    const response = await apiClient.get<EstudioDetailResponse>(
      `/estudios/${id}/`,
    );
    return response.data;
  },

  create: async (
    data: CreateEstudioRequest,
  ): Promise<CreateEstudioResponse> => {
    const response = await apiClient.post<CreateEstudioResponse>(
      "/estudios/",
      data,
    );
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateEstudioRequest,
  ): Promise<UpdateEstudioResponse> => {
    const response = await apiClient.put<UpdateEstudioResponse>(
      `/estudios/${id}/`,
      data,
    );
    return response.data;
  },

  delete: async (id: number): Promise<DeleteEstudioResponse> => {
    const response = await apiClient.delete<DeleteEstudioResponse>(
      `/estudios/${id}/`,
    );
    return response.data;
  },
};
