/**
 * Sessions API Types
 * Control de sesion unica: historial + conexiones activas por usuario.
 */

export const SESSION_ESTADO = {
  ACTIVA: "ACTIVA",
  CERRADA: "CERRADA",
} as const;

export type SessionEstado = (typeof SESSION_ESTADO)[keyof typeof SESSION_ESTADO];

export const SESSION_CERRADA_POR = {
  LOGOUT: "LOGOUT",
  EXPIRACION: "EXPIRACION",
} as const;

export type SessionCerradaPor =
  (typeof SESSION_CERRADA_POR)[keyof typeof SESSION_CERRADA_POR];

/**
 * Registro de conexion (historial o activa).
 * GET /api/v1/auth/ops/sessions
 */
export interface SessionListItem {
  id: number;
  usuario: string;
  nombreCompleto: string;
  ipOrigen: string | null;
  userAgent: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  duracionSegundos: number;
  estado: SessionEstado;
  cerradaPor: SessionCerradaPor | null;
}

export interface SessionsListParams {
  page?: number;
  pageSize?: number;
  usuario?: string;
  soloActivas?: boolean;
}

export interface SessionsListResponse {
  items: SessionListItem[];
  total: number;
  page: number;
  pageSize: number;
}
