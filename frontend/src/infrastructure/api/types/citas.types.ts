import type { ListResponse } from "@api/types/common.types";
import type { VisitService } from "@api/types/visits.types";

// ─── Constantes ───────────────────────────────────────────────────────────────

export const ESTATUS_CITA = {
  AGENDADA:   "agendada",
  CONFIRMADA: "confirmada",
  ATENDIDA:   "atendida",
  CANCELADA:  "cancelada",
  NO_ASISTIO: "no_asistio",
} as const;

export type EstatusCita = (typeof ESTATUS_CITA)[keyof typeof ESTATUS_CITA];

// ─── Entidades ────────────────────────────────────────────────────────────────

export interface CitaListItem {
  id:                 number;
  folio:              string;
  noExp:              string;
  pkNum:              number;
  medicoId:           number;
  medicoNombre:       string;
  consultorioId:      number | null;
  consultorioNombre:  string | null;
  fechaHora:          string;   // ISO 8601
  duracionMin:        number;
  servicioTipo:       VisitService;
  estatus:            EstatusCita;
  motivo:             string | null;
  notas:              string | null;
  createdAt:          string;
}

export interface SlotDisponible {
  fecha:        string;   // YYYY-MM-DD
  hora:         string;   // HH:mm
  duracionMin:  number;
  consultorioId: number | null;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface CreateCitaRequest {
  noExp:         string;
  pkNum?:        number;
  medicoId:      number;
  consultorioId?: number;
  fechaHora:     string;   // YYYY-MM-DDTHH:mm
  duracionMin?:  number;
  servicioTipo?: VisitService;
  motivo?:       string;
  notas?:        string;
}

export interface UpdateEstatusCitaRequest {
  estatus: "confirmada" | "atendida" | "cancelada" | "no_asistio";
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface CitasListParams {
  page?:          number;
  pageSize?:      number;
  medicoId?:      number;
  consultorioId?: number;
  centroId?:      number;
  noExp?:         string;
  folio?:         string;
  estatus?:       EstatusCita;
  fechaDesde?:    string;   // YYYY-MM-DD
  fechaHasta?:    string;   // YYYY-MM-DD
}

export interface SlotsParams {
  medicoId: number;
  fecha:    string;   // YYYY-MM-DD
}

// ─── Responses ────────────────────────────────────────────────────────────────

export type CitasListResponse = ListResponse<CitaListItem>;

export interface SlotsResponse {
  slots: SlotDisponible[];
}
