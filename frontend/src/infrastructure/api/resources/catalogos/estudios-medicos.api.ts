import apiClient from "@api/client";
import type {
  EstudiosMedicosListParams,
  EstudiosMedicosListResponse,
  EstudioMedicoDetailResponse,
  CreateEstudioMedicoRequest,
  CreateEstudioMedicoResponse,
  UpdateEstudioMedicoRequest,
  UpdateEstudioMedicoResponse,
  DeleteEstudioMedicoResponse,
} from "@api/types";

export const estudiosMedicosAPI = {
  getAll: async (
    params?: EstudiosMedicosListParams,
  ): Promise<EstudiosMedicosListResponse> => {
    const response = await apiClient.get<EstudiosMedicosListResponse>(
      "/med-studies/",
      { params },
    );
    return response.data;
  },

  getById: async (id: number): Promise<EstudioMedicoDetailResponse> => {
    const response = await apiClient.get<EstudioMedicoDetailResponse>(
      `/med-studies/${id}/`,
    );
    return response.data;
  },

  create: async (
    data: CreateEstudioMedicoRequest,
  ): Promise<CreateEstudioMedicoResponse> => {
    const response = await apiClient.post<CreateEstudioMedicoResponse>(
      "/med-studies/",
      data,
    );
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateEstudioMedicoRequest,
  ): Promise<UpdateEstudioMedicoResponse> => {
    const response = await apiClient.put<UpdateEstudioMedicoResponse>(
      `/med-studies/${id}/`,
      data,
    );
    return response.data;
  },

  delete: async (id: number): Promise<DeleteEstudioMedicoResponse> => {
    const response = await apiClient.delete<DeleteEstudioMedicoResponse>(
      `/med-studies/${id}/`,
    );
    return response.data;
  },
};
