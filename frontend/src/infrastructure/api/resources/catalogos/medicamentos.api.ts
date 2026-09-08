import apiClient from "@api/client";
import type {
  MedicamentosListParams,
  MedicamentosListResponse,
} from "@api/types/catalogos/medicamentos.types";

export const medicamentosAPI = {
  getAll: async (
    params?: MedicamentosListParams,
  ): Promise<MedicamentosListResponse> => {
    const response = await apiClient.get<MedicamentosListResponse>(
      "/medications/",
      { params },
    );
    return response.data;
  },
};
