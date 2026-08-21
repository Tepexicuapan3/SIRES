import apiClient from "@api/client";
import type {
  EdoCivilListParams,
  EdoCivilListResponse,
  EdoCivilDetailResponse,
  CreateEdoCivilRequest,
  CreateEdoCivilResponse,
  UpdateEdoCivilRequest,
  UpdateEdoCivilResponse,
  DeleteEdoCivilResponse,
} from "@api/types";

export const edoCivilAPI = {
  getAll: async (params?: EdoCivilListParams): Promise<EdoCivilListResponse> => {
    const response = await apiClient.get<EdoCivilListResponse>("/civil-status/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<EdoCivilDetailResponse> => {
    const response = await apiClient.get<EdoCivilDetailResponse>(`/civil-status/${id}/`);
    return response.data;
  },

  create: async (data: CreateEdoCivilRequest): Promise<CreateEdoCivilResponse> => {
    const response = await apiClient.post<CreateEdoCivilResponse>("/civil-status/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateEdoCivilRequest): Promise<UpdateEdoCivilResponse> => {
    const response = await apiClient.put<UpdateEdoCivilResponse>(`/civil-status/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteEdoCivilResponse> => {
    const response = await apiClient.delete<DeleteEdoCivilResponse>(`/civil-status/${id}/`);
    return response.data;
  },
};
