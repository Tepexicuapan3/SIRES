import apiClient from "@api/client";
import type {
  ReligionesListParams,
  ReligionesListResponse,
  ReligionDetailResponse,
  CreateReligionRequest,
  CreateReligionResponse,
  UpdateReligionRequest,
  UpdateReligionResponse,
  DeleteReligionResponse,
} from "@api/types";

export const religionesAPI = {
  getAll: async (params?: ReligionesListParams): Promise<ReligionesListResponse> => {
    const response = await apiClient.get<ReligionesListResponse>("/religions/", { params });
    return response.data;
  },
  getById: async (id: number): Promise<ReligionDetailResponse> => {
    const response = await apiClient.get<ReligionDetailResponse>(`/religions/${id}/`);
    return response.data;
  },
  create: async (data: CreateReligionRequest): Promise<CreateReligionResponse> => {
    const response = await apiClient.post<CreateReligionResponse>("/religions/", data);
    return response.data;
  },
  update: async (id: number, data: UpdateReligionRequest): Promise<UpdateReligionResponse> => {
    const response = await apiClient.put<UpdateReligionResponse>(`/religions/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<DeleteReligionResponse> => {
    const response = await apiClient.delete<DeleteReligionResponse>(`/religions/${id}/`);
    return response.data;
  },
};
