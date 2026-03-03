import type { ListResponse } from "@api/types/common.types";

export const ARRIVAL_TYPE = {
  APPOINTMENT: "appointment",
  WALK_IN: "walk_in",
} as const;

export type ArrivalType = (typeof ARRIVAL_TYPE)[keyof typeof ARRIVAL_TYPE];

export const VISIT_SERVICE = {
  MEDICINA_GENERAL: "medicina_general",
  ESPECIALIDAD: "especialidad",
  URGENCIAS: "urgencias",
} as const;

export type VisitService = (typeof VISIT_SERVICE)[keyof typeof VISIT_SERVICE];

export const VISIT_STATUS = {
  EN_ESPERA: "en_espera",
  EN_SOMATOMETRIA: "en_somatometria",
  LISTA_PARA_DOCTOR: "lista_para_doctor",
  EN_CONSULTA: "en_consulta",
  CERRADA: "cerrada",
  CANCELADA: "cancelada",
  NO_SHOW: "no_show",
} as const;

export type VisitStatus = (typeof VISIT_STATUS)[keyof typeof VISIT_STATUS];

export interface VisitQueueItem {
  id: number;
  folio: string;
  patientId: number;
  arrivalType: ArrivalType;
  serviceType: VisitService;
  appointmentId: string | null;
  doctorId: number | null;
  notes: string | null;
  status: VisitStatus;
  vitals?: VisitVitalsPayload | null;
}

export interface VisitsListParams {
  page?: number;
  pageSize?: number;
  status?: VisitStatus;
  serviceType?: VisitService;
  date?: string;
  doctorId?: number;
}

export type VisitsListResponse = ListResponse<VisitQueueItem>;

export interface CreateVisitRequest {
  patientId: number;
  arrivalType: ArrivalType;
  serviceType: VisitService;
  appointmentId?: string;
  doctorId?: number;
  notes?: string;
}

export type CreateVisitResponse = VisitQueueItem;

export const RECEPCION_STATUS_ACTION = {
  EN_SOMATOMETRIA: "en_somatometria",
  CANCELADA: "cancelada",
  NO_SHOW: "no_show",
} as const;

export type RecepcionStatusAction =
  (typeof RECEPCION_STATUS_ACTION)[keyof typeof RECEPCION_STATUS_ACTION];

export interface UpdateVisitStatusRequest {
  targetStatus: RecepcionStatusAction;
}

export interface UpdateVisitStatusResponse {
  id: number;
  status: VisitStatus;
}

export interface CaptureVitalsRequest {
  weightKg: number;
  heightCm: number;
  temperatureC: number;
  oxygenSaturationPct: number;
  heartRateBpm?: number;
  respiratoryRateBpm?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  waistCircumferenceCm?: number;
  notes?: string;
}

export interface VisitVitalsPayload extends CaptureVitalsRequest {
  bmi: number;
}

export interface CaptureVitalsResponse {
  visitId: number;
  status: VisitStatus;
  vitals: VisitVitalsPayload;
}

export interface SaveDiagnosisRequest {
  primaryDiagnosis: string;
  finalNote: string;
}

export interface SaveDiagnosisResponse {
  visitId: number;
  status: VisitStatus;
  primaryDiagnosis: string;
  finalNote: string;
}

export interface SavePrescriptionRequest {
  items: string[];
}

export interface SavePrescriptionResponse {
  visitId: number;
  status: VisitStatus;
  items: string[];
}

export type StartConsultationResponse = VisitQueueItem;

export interface CloseVisitRequest {
  primaryDiagnosis: string;
  finalNote: string;
}

export interface VisitConsultationSummary {
  id: number;
  visitId: number;
  doctorId: number;
  primaryDiagnosis: string;
  finalNote: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CloseVisitResponse {
  visit: VisitQueueItem;
  consultation: VisitConsultationSummary;
}
