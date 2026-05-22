import apiClient from "@api/client";
import type {
  CitaListItem,
  CitasListParams,
  CitasListResponse,
  CreateCitaRequest,
  SlotsParams,
  SlotsResponse,
  UpdateEstatusCitaRequest,
} from "@api/types";

export const citasAPI = {

  getAll: async (params?: CitasListParams): Promise<CitasListResponse> => {
    const r = await apiClient.get<CitasListResponse>("/citas", { params });
    return r.data;
  },

  getById: async (id: number): Promise<CitaListItem> => {
    const r = await apiClient.get<CitaListItem>(`/citas/${id}`);
    return r.data;
  },

  create: async (data: CreateCitaRequest): Promise<CitaListItem> => {
    const r = await apiClient.post<CitaListItem>("/citas", data);
    return r.data;
  },

  updateEstatus: async (id: number, data: UpdateEstatusCitaRequest): Promise<CitaListItem> => {
    const r = await apiClient.patch<CitaListItem>(`/citas/${id}/estatus`, data);
    return r.data;
  },

  getSlots: async (params: SlotsParams): Promise<SlotsResponse> => {
    const r = await apiClient.get<SlotsResponse>("/citas/slots", { params });
    return r.data;
  },
};
