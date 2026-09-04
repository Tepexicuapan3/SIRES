import apiClient from "@api/client";
import type { PatientConsultationsHistoryResponse } from "@api/types/patient-consultations.types";

export const patientConsultationsAPI = {
  getHistory: async (
    noExp: string,
    pkNum = 0,
  ): Promise<PatientConsultationsHistoryResponse> => {
    const response = await apiClient.get<PatientConsultationsHistoryResponse>(
      `/patients/${noExp}/consultations`,
      { params: { pkNum } },
    );
    return response.data;
  },
};
