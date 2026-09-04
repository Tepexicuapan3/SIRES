import apiClient from "@api/client";
import type {
  ClinicalHistory,
  UpdateClinicalHistoryRequest,
} from "@api/types/clinical-history.types";

export const clinicalHistoryAPI = {
  get: async (noExp: string, pkNum = 0): Promise<ClinicalHistory> => {
    const response = await apiClient.get<ClinicalHistory>(
      `/patients/${noExp}/clinical-history`,
      { params: { pkNum } },
    );
    return response.data;
  },

  update: async (
    noExp: string,
    pkNum: number,
    data: UpdateClinicalHistoryRequest,
  ): Promise<ClinicalHistory> => {
    const response = await apiClient.patch<ClinicalHistory>(
      `/patients/${noExp}/clinical-history`,
      data,
      { params: { pkNum } },
    );
    return response.data;
  },
};
