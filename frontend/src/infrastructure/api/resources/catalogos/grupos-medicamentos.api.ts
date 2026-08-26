import apiClient from "@api/client";
import type {
  GruposMedicamentosListParams,
  GruposMedicamentosListResponse,
  GrupoMedicamentosDetailResponse,
  CreateGrupoMedicamentosRequest,
  CreateGrupoMedicamentosResponse,
  UpdateGrupoMedicamentosRequest,
  UpdateGrupoMedicamentosResponse,
  DeleteGrupoMedicamentosResponse,
} from "@api/types";

export const gruposMedicamentosAPI = {
  getAll: async (params?: GruposMedicamentosListParams): Promise<GruposMedicamentosListResponse> => {
    const response = await apiClient.get<GruposMedicamentosListResponse>("/med-groups/", { params });
    return response.data;
  },

  getById: async (id: number): Promise<GrupoMedicamentosDetailResponse> => {
    const response = await apiClient.get<GrupoMedicamentosDetailResponse>(`/med-groups/${id}/`);
    return response.data;
  },

  create: async (data: CreateGrupoMedicamentosRequest): Promise<CreateGrupoMedicamentosResponse> => {
    const response = await apiClient.post<CreateGrupoMedicamentosResponse>("/med-groups/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateGrupoMedicamentosRequest): Promise<UpdateGrupoMedicamentosResponse> => {
    const response = await apiClient.put<UpdateGrupoMedicamentosResponse>(`/med-groups/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<DeleteGrupoMedicamentosResponse> => {
    const response = await apiClient.delete<DeleteGrupoMedicamentosResponse>(`/med-groups/${id}/`);
    return response.data;
  },
};
