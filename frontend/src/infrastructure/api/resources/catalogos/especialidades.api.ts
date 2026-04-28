import apiClient from "@api/client";
import type {
  EspecialidadesListParams,
  EspecialidadesListResponse,
  EspecialidadDetailResponse,
  CreateEspecialidadRequest,
  CreateEspecialidadResponse,
  UpdateEspecialidadRequest,
  UpdateEspecialidadResponse,
  DeleteEspecialidadResponse,
} from "@api/types";

export const especialidadesAPI = {
  getAll: async (
    params?: EspecialidadesListParams,
  ): Promise<EspecialidadesListResponse> => {
    const response = await apiClient.get<EspecialidadesListResponse>(
      "/specialties/",
      { params },
    );
    return response.data;
  },

  getById: async (id: number): Promise<EspecialidadDetailResponse> => {
    const response = await apiClient.get<EspecialidadDetailResponse>(
      `/specialties/${id}/`,
    );
    return response.data;
  },

  create: async (
    data: CreateEspecialidadRequest,
  ): Promise<CreateEspecialidadResponse> => {
    const response = await apiClient.post<CreateEspecialidadResponse>(
      "/specialties/",
      data,
    );
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateEspecialidadRequest,
  ): Promise<UpdateEspecialidadResponse> => {
    const response = await apiClient.put<UpdateEspecialidadResponse>(
      `/specialties/${id}/`,
      data,
    );
    return response.data;
  },

  delete: async (id: number): Promise<DeleteEspecialidadResponse> => {
    const response = await apiClient.delete<DeleteEspecialidadResponse>(
      `/specialties/${id}/`,
    );
    return response.data;
  },
};
