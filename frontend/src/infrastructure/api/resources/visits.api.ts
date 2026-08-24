import apiClient from "@api/client";
import type {
  CieSearchParams,
  CieSearchResponse,
  CaptureVitalsRequest,
  CaptureVitalsResponse,
  LatestVitalsResponse,
  CloseVisitRequest,
  CloseVisitResponse,
  CreateVisitRequest,
  CreateVisitResponse,
  PatientLookupResponse,
  SaveDiagnosisRequest,
  SaveDiagnosisResponse,
  SavePrescriptionRequest,
  SavePrescriptionResponse,
  StartConsultationResponse,
  UpdateVisitStatusRequest,
  UpdateVisitStatusResponse,
  VisitStatusLogResponse,
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

  /** Ultima captura de vitales del paciente de esta visita, para precargar
   * el formulario -- `vitals: null` si el paciente nunca tuvo una previa. */
  getLatestVitals: async (visitId: number): Promise<LatestVitalsResponse> => {
    const response = await apiClient.get<LatestVitalsResponse>(
      `/visits/${visitId}/vitals`,
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

  searchCies: async (params: CieSearchParams): Promise<CieSearchResponse> => {
    const response = await apiClient.get<CieSearchResponse>(
      "/visits/cies/search",
      {
        params,
      },
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

  startConsultation: async (
    visitId: number,
  ): Promise<StartConsultationResponse> => {
    const response = await apiClient.post<StartConsultationResponse>(
      `/visits/${visitId}/consultation/start`,
      {},
    );
    return response.data;
  },

  closeVisit: async (
    visitId: number,
    data: CloseVisitRequest,
  ): Promise<CloseVisitResponse> => {
    const response = await apiClient.post<CloseVisitResponse>(
      `/visits/${visitId}/consultation/close`,
      data,
    );
    return response.data;
  },

  patientLookup: async (noExp: string, historico = false): Promise<PatientLookupResponse> => {
    const response = await apiClient.get<PatientLookupResponse>(
      "/visits/patient-lookup",
      { params: { noExp, ...(historico ? { historico: "true" } : {}) } },
    );
    return response.data;
  },

  downloadFicha: async (visitId: number): Promise<Blob> => {
    const response = await apiClient.get(`/visits/${visitId}/ficha`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  getStatusLog: async (visitId: number): Promise<VisitStatusLogResponse> => {
    const response = await apiClient.get<VisitStatusLogResponse>(
      `/visits/${visitId}/status-log`,
    );
    return response.data;
  },
};
