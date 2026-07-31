/**
 * Endpoints de autenticación del portal (Fase 2 del backend).
 *
 * Contratos confirmados leyendo el código real del backend (NO asumidos):
 *   - Rutas: backend/apps/portal_citas/urls.py:16-30
 *   - Campos de entrada: backend/apps/portal_citas/serializers.py:13-29
 *   - Shapes de respuesta: backend/apps/portal_citas/uses_case/
 *     iniciar_sesion_usecase.py:62,78 · capturar_correo_usecase.py:62 ·
 *     verificar_codigo_usecase.py + views.py:182-189 (VerificarCodigoView
 *     arma la respuesta final agregando tokenType: "Bearer" a mano).
 *   - Errores: backend/apps/portal_citas/errors.py (PortalAuthError) +
 *     response_service.error_response -> { code, message, status,
 *     timestamp, details?, requestId? }.
 *
 * Todos los 3 endpoints exigen los mismos 3 datos de identidad en cada
 * paso (noExp + nombreCompleto + fechaNacimiento) porque el backend
 * re-resuelve la identidad en cada request — no hay token intermedio de
 * pre-sesión entre pasos.
 */

import apiClient from "@/api/client";

export interface Identidad {
  /** Número de expediente. Máx 20 caracteres (serializers.py:14). */
  noExp: string;
  /** Máx 255 caracteres (serializers.py:15). */
  nombreCompleto: string;
  /** Formato YYYY-MM-DD — coincide con el value nativo de <input type="date"> (serializers.py:16). */
  fechaNacimiento: string;
}

export type IniciarSesionResponse =
  | { requiereCorreo: true }
  | { requiereCorreo: false; correoEnmascarado: string };

export interface CapturarCorreoResponse {
  correoEnmascarado: string;
}

export interface VerificarCodigoResponse {
  accessToken: string;
  tokenType: "Bearer";
  /** ISO 8601 UTC (ej. "2026-07-29T18:30:00Z"). */
  expiraEn: string;
}

export function iniciarSesion(identidad: Identidad): Promise<IniciarSesionResponse> {
  return apiClient
    .post<IniciarSesionResponse>("/portal/auth/iniciar-sesion", identidad)
    .then((res) => res.data);
}

export function capturarCorreo(
  identidad: Identidad,
  correo: string
): Promise<CapturarCorreoResponse> {
  return apiClient
    .post<CapturarCorreoResponse>("/portal/auth/capturar-correo", {
      ...identidad,
      correo,
    })
    .then((res) => res.data);
}

export function verificarCodigo(
  identidad: Identidad,
  codigo: string
): Promise<VerificarCodigoResponse> {
  return apiClient
    .post<VerificarCodigoResponse>("/portal/auth/verificar-codigo", {
      ...identidad,
      codigo,
    })
    .then((res) => res.data);
}
