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
  fechaConsulta:      string | null;  // YYYY-MM-DD — fecha elegida por recepcionista al check-in
  fechaCita:          string | null;  // ISO 8601 — datetime de la cita médica vinculada
  numFicha:           number | null;
  turnoNombre:        string;
  status:             VisitStatus;
  fechaAlta:          string | null;
  createdById:        number | null;
  vitals:             VisitVitalsPayload | null;
}

// ── Auditoría NOM-024-SSA3-2012 ───────────────────────────────────────────────

export interface VisitStatusLogItem {
  id:               number;
  fromStatus:       VisitStatus | null;
  toStatus:         VisitStatus;
  changedById:      number | null;
  changedByNombre:  string | null;
  changedAt:        string;   // ISO 8601
  notes:            string | null;
}

export interface VisitStatusLogResponse {
  items: VisitStatusLogItem[];
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
  fechaConsulta?:  string;  // YYYY-MM-DD — fecha elegida por recepcionista
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
  fechaDesde?:    string;  // YYYY-MM-DD rango inicio
  fechaHasta?:    string;  // YYYY-MM-DD rango fin
  folio?:         string;
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
  glucosaCapilarMgdl?: number;
  notes?: string;
  /** Visita origen cuando la enfermera elige reusar una captura del mismo
   * dia (`todayCapture`). El servidor NUNCA copia los valores de esa
   * visita: siempre guarda lo que viaja en este payload. Este campo es
   * solo un sello de auditoria (NOM-024). */
  reusedFromVisitId?: number;
}

/** Detalle de la visita ORIGEN cuando `VisitVitalsPayload.reusedFromVisitId`
 * no es `null` -- mismos nombres de campo que `TodayCapturePayload`
 * (`sourceFolio`, `sourceServiceType`, `capturedAt`) para consistencia del
 * contrato. Permite al medico ver folio/especialidad/hora de origen, no
 * solo un id crudo. */
export interface ReusedFromPayload {
  sourceVisitId: number;
  sourceFolio: string;
  sourceServiceType: VisitService;
  /** Momento en que se tomo la captura EN LA VISITA ORIGEN (no en esta). */
  capturedAt: string;
}

export interface VisitVitalsPayload extends Omit<CaptureVitalsRequest, "reusedFromVisitId"> {
  bmi: number;
  /** Momento de captura (`VisitVitalSigns.fch_alta`) -- visible tanto para
   * la enfermera (bandeja) como para el medico (`ConsultationDetailDialog`). */
  capturedAt: string;
  /** Visita origen si esta captura fue un reuso; `null` si se tomo de cero. */
  reusedFromVisitId: number | null;
  /** Folio/especialidad/hora de la visita origen del reuso; `null` cuando
   * `reusedFromVisitId` tambien es `null` (retrocompatible). */
  reusedFrom: ReusedFromPayload | null;
}

export interface CaptureVitalsResponse {
  visitId: number;
  status: VisitStatus;
  vitals: VisitVitalsPayload;
}

/** Ultima captura de vitales del PACIENTE (no de esta visita) -- para
 * precargar el formulario. `null` si el paciente nunca tuvo una captura
 * previa. `notes` no viaja: las observaciones son propias de cada visita,
 * no algo que tenga sentido reciclar. */
export interface LatestPatientVitals {
  weightKg: number;
  heightCm: number;
  temperatureC: number | null;
  oxygenSaturationPct: number | null;
  heartRateBpm: number | null;
  respiratoryRateBpm: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  waistCircumferenceCm: number | null;
  glucosaCapilarMgdl: number | null;
  bmi: number;
  capturedAt: string;
}

/** Captura de signos vitales YA tomada HOY (dia calendario local) a la
 * misma persona (mismo `no_exp`+`pk_num`) en OTRA visita -- permite a la
 * enfermera reusarla sin repetir la toma. `null` cuando no existe ninguna
 * (o cuando la unica captura de hoy es la de la propia visita). */
export interface TodayCapturePayload {
  sourceVisitId: number;
  sourceFolio: string;
  sourceServiceType: VisitService;
  capturedAt: string;
  values: Omit<LatestPatientVitals, "capturedAt">;
}

export interface LatestVitalsResponse {
  vitals: LatestPatientVitals | null;
  todayCapture: TodayCapturePayload | null;
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
