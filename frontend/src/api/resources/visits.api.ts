import apiClient from "@api/client";
import type {
  CaptureVitalsRequest,
  CaptureVitalsResponse,
  CloseVisitRequest,
  CloseVisitResponse,
  CreateVisitRequest,
  CreateVisitResponse,
  SaveDiagnosisRequest,
  SaveDiagnosisResponse,
  SavePrescriptionRequest,
  SavePrescriptionResponse,
  UpdateVisitStatusRequest,
  UpdateVisitStatusResponse,
  VisitsListParams,
  VisitsListResponse,
} from "@api/types";

export const visitsAPI = {
  getAll: async (params?: VisitsListParams): Promise<VisitsListResponse> => {
    const response = await apiClient.get<VisitsListResponse>("/visits", {
      params,
    });
    return response.data;
  },

  create: async (data: CreateVisitRequest): Promise<CreateVisitResponse> => {
    const response = await apiClient.post<CreateVisitResponse>("/visits", data);
    return response.data;
  },

  updateStatus: async (
    visitId: number,
    data: UpdateVisitStatusRequest,
  ): Promise<UpdateVisitStatusResponse> => {
    const response = await apiClient.patch<UpdateVisitStatusResponse>(
      `/visits/${visitId}/status`,
      data,
    );
    return response.data;
  },

  captureVitals: async (
    visitId: number,
    data: CaptureVitalsRequest,
  ): Promise<CaptureVitalsResponse> => {
    const response = await apiClient.post<CaptureVitalsResponse>(
      `/visits/${visitId}/vitals`,
      data,
    );
    return response.data;
  },

  saveDiagnosis: async (
    visitId: number,
    data: SaveDiagnosisRequest,
  ): Promise<SaveDiagnosisResponse> => {
    const response = await apiClient.post<SaveDiagnosisResponse>(
      `/visits/${visitId}/diagnosis`,
      data,
    );
    return response.data;
  },

  savePrescriptions: async (
    visitId: number,
    data: SavePrescriptionRequest,
  ): Promise<SavePrescriptionResponse> => {
    const response = await apiClient.post<SavePrescriptionResponse>(
      `/visits/${visitId}/prescriptions`,
      data,
    );
    return response.data;
  },

  closeVisit: async (
    visitId: number,
    data: CloseVisitRequest,
  ): Promise<CloseVisitResponse> => {
    const response = await apiClient.post<CloseVisitResponse>(
      `/visits/${visitId}/close`,
      data,
    );
    return response.data;
  },
};
