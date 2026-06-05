import type { ListResponse } from "@api/types/common.types";

// ── Enums / literales ─────────────────────────────────────────────────────────

export const CONTRATO_STATUS = {
  VIGENTE:    "VIGENTE",
  VENCIDO:    "VENCIDO",
  POR_VENCER: "POR_VENCER",
} as const;

export type ContratoStatus = (typeof CONTRATO_STATUS)[keyof typeof CONTRATO_STATUS];

export const TP_DER = {
  T: "T",
  E: "E",
  J: "J",
  P: "P",
  F: "F",
  O: "O",
} as const;

export type TpDer = (typeof TP_DER)[keyof typeof TP_DER];

export const TP_DER_LABELS: Record<TpDer, string> = {
  T: "Titular",
  E: "Esposa/o",
  J: "Jubilado",
  P: "Pensionado",
  F: "Familiar",
  O: "Otro",
};

export const CONTRATO_STATUS_LABELS: Record<ContratoStatus, string> = {
  VIGENTE:    "Vigente",
  VENCIDO:    "Vencido",
  POR_VENCER: "Por Vencer",
};

// ── Entidad principal ─────────────────────────────────────────────────────────

export interface ContratoOxigeno {
  id:            number;
  sucursal:      string;
  numContrato:   string;
  nombre:        string;
  expediente:    string;
  tpDer:         TpDer;
  tpDerLabel:    string;
  clinica:       string;
  servicio:      string;
  fechaSoporte:  string | null;   // YYYY-MM-DD
  vigenciaMeses: number | null;
  vigenciaDias:  number | null;
  fechaRenovar:  string | null;   // YYYY-MM-DD
  diasFaltan:    number | null;
  status:        ContratoStatus;
  statusLabel:   string;
  diagnostico:   string;
  fchAlta:       string;          // ISO 8601
  fchModf:       string;          // ISO 8601
}

// ── Requests ──────────────────────────────────────────────────────────────────

export interface CreateContratoRequest {
  sucursal:      string;
  numContrato:   string;
  nombre:        string;
  expediente:    string;
  tpDer:         TpDer;
  clinica:       string;
  servicio:      string;
  fechaSoporte?:  string | null;
  vigenciaMeses?: number | null;
  vigenciaDias?:  number | null;
  fechaRenovar?:  string | null;
  diagnostico?:   string;
}

export type UpdateContratoRequest = Partial<CreateContratoRequest>;

// ── Params de listado ─────────────────────────────────────────────────────────

export interface ContratosListParams {
  page?:     number;
  pageSize?: number;
  search?:   string;
  sucursal?: string;
  status?:   ContratoStatus;
  tpDer?:    TpDer;
  clinica?:  string;
  ordering?: string;
}

export type ContratosListResponse = ListResponse<ContratoOxigeno>;

// ── Estadísticas ──────────────────────────────────────────────────────────────

export interface ContratosStats {
  total:           number;
  vigentes:        number;
  porVencer:       number;
  vencidos:        number;
  porStatus:       Record<string, number>;
  porSucursal:     Record<string, number>;
  porVencer30Dias: number;
}
