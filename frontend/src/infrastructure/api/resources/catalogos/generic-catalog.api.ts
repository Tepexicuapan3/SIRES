import apiClient from "@api/client";
import type {
  GenericCatalogListParams,
  GenericCatalogListResponse,
} from "@api/types/catalogos/generic-catalog.types";

export const genericCatalogAPI = {
  getAll: async (
    endpoint: string,
    params?: GenericCatalogListParams,
  ): Promise<GenericCatalogListResponse> => {
    const response = await apiClient.get<GenericCatalogListResponse>(
      `/${endpoint}`,
      {
        params,
      },
    );

    return response.data;
  },
};
