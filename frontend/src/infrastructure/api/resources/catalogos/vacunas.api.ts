/**
 * Vacunas API Resource
 *
 * Endpoints:
 * - GET    /vaccines/
 * - POST   /vaccines/
 * - GET    /vaccines/:id
 * - PUT    /vaccines/:id
 * - DELETE /vaccines/:id
 */

import apiClient from "@api/client";
import type {
  VacunasListParams,
  VacunasListResponse,
  VacunaDetailResponse,
  CreateVacunaRequest,
  CreateVacunaResponse,
  UpdateVacunaRequest,
  UpdateVacunaResponse,
  DeleteVacunaResponse,
} from "@api/types";

export const vacunasAPI = {
  getAll: async (params?: VacunasListParams): Promise<VacunasListResponse> => {
    const response = await apiClient.get<VacunasListResponse>("/vaccines/", {
      params,
    });
    return response.data;
  },

  getById: async (vacunaId: number): Promise<VacunaDetailResponse> => {
    const response = await apiClient.get<VacunaDetailResponse>(
      `/vaccines/${vacunaId}/`,
    );
    return response.data;
  },

  create: async (data: CreateVacunaRequest): Promise<CreateVacunaResponse> => {
    const response = await apiClient.post<CreateVacunaResponse>(
      "/vaccines/",
      data,
    );
    return response.data;
  },

  update: async (
    vacunaId: number,
    data: UpdateVacunaRequest,
  ): Promise<UpdateVacunaResponse> => {
    const response = await apiClient.put<UpdateVacunaResponse>(
      `/vaccines/${vacunaId}/`,
      data,
    );
    return response.data;
  },

  delete: async (vacunaId: number): Promise<DeleteVacunaResponse> => {
    const response = await apiClient.delete<DeleteVacunaResponse>(
      `/vaccines/${vacunaId}/`,
    );
    return response.data;
  },
};
