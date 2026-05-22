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
  id:                 number;
  folio:              string;
  noExp:              string;
  pkNum:              number;
  nombrePaciente:     string | null;
  arrivalType:        ArrivalType;
  serviceType:        VisitService;
  appointmentId:      string | null;
  doctorId:           number | null;
  doctorNombre:       string | null;
  consultorioId:      number | null;
  consultorioNombre:  string | null;
  centroId:           number | null;
  centroNombre:       string | null;
  notes:              string | null;
  horaConsulta:       string | null;  // HH:mm
  numFicha:           number | null;
  turnoNombre:        string;
  status:             VisitStatus;
  fechaAlta:          string | null;
  vitals:             VisitVitalsPayload | null;
}

export type VisitsListResponse = ListResponse<VisitQueueItem>;

export interface CreateVisitRequest {
  noExp:           string;
  pkNum?:          number;
  nombrePaciente?: string;
  arrivalType:     ArrivalType;
  serviceType:     VisitService;
  appointmentId?:  string;
  doctorId?:       number;
  consultorioId?:  number;
  notes?:          string;
  horaConsulta?:   string;  // HH:mm
}

export interface VisitsListParams {
  page?:          number;
  pageSize?:      number;
  status?:        VisitStatus;
  serviceType?:   VisitService;
  date?:          string;
  doctorId?:      number;
  consultorioId?: number;
  centroId?:      number;
  noExp?:         string;
}

// ── Lookup de paciente por expediente ────────────────────────────────────────

export interface PatientMember {
  noExp:      string;
  pkNum:      number;
  nombre:     string;
  edad:       number | null;
  fechaNac:   string | null;  // YYYY-MM-DD
  parentesco: string | null;
  estatus:    string | null;
  cdClinica:  string | null;
}

export interface PatientLookupResponse {
  /** null cuando el trabajador titular está de baja */
  titular:      PatientMember | null;
  dependientes: PatientMember[];
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
  cieCode?: string;
}

export interface SaveDiagnosisResponse {
  visitId: number;
  status: VisitStatus;
  primaryDiagnosis: string;
  finalNote: string;
  cieCode?: string | null;
}

export interface CieSearchParams {
  search: string;
  limit?: number;
}

export interface CieSearchItem {
  code: string;
  description: string;
  version: string;
}

export interface CieSearchResponse {
  items: CieSearchItem[];
  total: number;
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
  cieCode?: string;
}

export interface VisitConsultationSummary {
  id: number;
  visitId: number;
  doctorId: number;
  primaryDiagnosis: string;
  cieCode: string | null;
  finalNote: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CloseVisitResponse {
  visit: VisitQueueItem;
  consultation: VisitConsultationSummary;
}
