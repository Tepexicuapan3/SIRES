import apiClient from "@api/client";
import type {
  ContratoOxigeno,
  ContratosListParams,
  ContratosListResponse,
  ContratosStats,
  CreateContratoRequest,
  UpdateContratoRequest,
} from "@api/types";

export const contratosAPI = {
  getAll: async (params?: ContratosListParams): Promise<ContratosListResponse> => {
    const response = await apiClient.get<ContratosListResponse>("/contratos-oxigeno/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<ContratoOxigeno> => {
    const response = await apiClient.get<ContratoOxigeno>(`/contratos-oxigeno/${id}/`);
    return response.data;
  },

  create: async (data: CreateContratoRequest): Promise<ContratoOxigeno> => {
    const response = await apiClient.post<ContratoOxigeno>("/contratos-oxigeno/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateContratoRequest): Promise<ContratoOxigeno> => {
    const response = await apiClient.patch<ContratoOxigeno>(`/contratos-oxigeno/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/contratos-oxigeno/${id}/`);
  },

  getStats: async (): Promise<ContratosStats> => {
    const response = await apiClient.get<ContratosStats>("/contratos-oxigeno/estadisticas/");
    return response.data;
  },
};
