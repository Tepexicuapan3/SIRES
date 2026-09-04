import apiClient from "@api/client";
import type {
  StomatologyHistory,
  UpdateStomatologyHistoryRequest,
} from "@api/types/stomatology-history.types";

export const stomatologyHistoryAPI = {
  get: async (noExp: string, pkNum = 0): Promise<StomatologyHistory> => {
    const response = await apiClient.get<StomatologyHistory>(
      `/patients/${noExp}/stomatology-history`,
      { params: { pkNum } },
    );
    return response.data;
  },

  update: async (
    noExp: string,
    pkNum: number,
    data: UpdateStomatologyHistoryRequest,
  ): Promise<StomatologyHistory> => {
    const response = await apiClient.patch<StomatologyHistory>(
      `/patients/${noExp}/stomatology-history`,
      data,
      { params: { pkNum } },
    );
    return response.data;
  },
};
