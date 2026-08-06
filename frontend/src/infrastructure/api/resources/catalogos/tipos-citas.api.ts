import apiClient from "@api/client";
import type {
  TiposCitasListParams,
  TiposCitasListResponse,
  TipoCitaDetailResponse,
  CreateTipoCitaRequest,
  CreateTipoCitaResponse,
  UpdateTipoCitaRequest,
  UpdateTipoCitaResponse,
  DeleteTipoCitaResponse,
} from "@api/types";

export const tiposCitasAPI = {
  getAll: async (params?: TiposCitasListParams): Promise<TiposCitasListResponse> => {
    const response = await apiClient.get<TiposCitasListResponse>("/appointment-types/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoCitaDetailResponse> => {
    const response = await apiClient.get<TipoCitaDetailResponse>(`/appointment-types/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoCitaRequest): Promise<CreateTipoCitaResponse> => {
    const response = await apiClient.post<CreateTipoCitaResponse>("/appointment-types/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoCitaRequest): Promise<UpdateTipoCitaResponse> => {
    const response = await apiClient.put<UpdateTipoCitaResponse>(`/appointment-types/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteTipoCitaResponse> => {
    const response = await apiClient.delete<DeleteTipoCitaResponse>(`/appointment-types/${id}/`);
    return response.data;
  },
};
