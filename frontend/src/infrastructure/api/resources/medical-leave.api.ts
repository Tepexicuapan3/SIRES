import apiClient from "@api/client";
import type {
  CreateMedicalLeaveRequest,
  MedicalLeaveItem,
  PatientMedicalLeavesResponse,
} from "@api/types/medical-leave.types";

export const medicalLeaveAPI = {
  getPatientHistory: async (
    noExp: string,
    pkNum = 0,
  ): Promise<PatientMedicalLeavesResponse> => {
    const response = await apiClient.get<PatientMedicalLeavesResponse>(
      `/patients/${noExp}/medical-leaves`,
      { params: { pkNum } },
    );
    return response.data;
  },

  create: async (
    visitId: number,
    data: CreateMedicalLeaveRequest,
  ): Promise<MedicalLeaveItem> => {
    const response = await apiClient.post<MedicalLeaveItem>(
      `/visits/${visitId}/medical-leave`,
      data,
    );
    return response.data;
  },
};
