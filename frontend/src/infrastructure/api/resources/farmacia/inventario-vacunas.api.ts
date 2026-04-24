/**
 * Inventario de Vacunas API Resource (Farmacia)
 *
 * Endpoints:
 * - GET    /vaccine-inventory/
 * - POST   /vaccine-inventory/
 * - GET    /vaccine-inventory/:id
 * - PUT    /vaccine-inventory/:id
 * - DELETE /vaccine-inventory/:id
 */

import apiClient from "@api/client";
import type {
  InventarioVacunaListParams,
  InventarioVacunaListResponse,
  InventarioVacunaDetailResponse,
  CreateInventarioVacunaRequest,
  CreateInventarioVacunaResponse,
  UpdateInventarioVacunaRequest,
  UpdateInventarioVacunaResponse,
  DeleteInventarioVacunaResponse,
  ApplyDosesRequest,
  ApplyDosesResponse,
} from "@api/types/farmacia/inventario-vacunas.types";

export const inventarioVacunasAPI = {
  getAll: async (params?: InventarioVacunaListParams): Promise<InventarioVacunaListResponse> => {
    const response = await apiClient.get<InventarioVacunaListResponse>("/vaccine-inventory/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<InventarioVacunaDetailResponse> => {
    const response = await apiClient.get<InventarioVacunaDetailResponse>(`/vaccine-inventory/${id}/`);
    return response.data;
  },

  create: async (data: CreateInventarioVacunaRequest): Promise<CreateInventarioVacunaResponse> => {
    const response = await apiClient.post<CreateInventarioVacunaResponse>("/vaccine-inventory/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateInventarioVacunaRequest): Promise<UpdateInventarioVacunaResponse> => {
    const response = await apiClient.put<UpdateInventarioVacunaResponse>(`/vaccine-inventory/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteInventarioVacunaResponse> => {
    const response = await apiClient.delete<DeleteInventarioVacunaResponse>(`/vaccine-inventory/${id}/`);
    return response.data;
  },

  applyDoses: async (id: number, data: ApplyDosesRequest): Promise<ApplyDosesResponse> => {
    const response = await apiClient.post<ApplyDosesResponse>(`/vaccine-inventory/${id}/apply-doses/`, data);
    return response.data;
  },
};
