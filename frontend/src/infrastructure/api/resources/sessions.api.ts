/**
 * Sessions API Resource
 *
 * Control de sesion unica: historial + conexiones activas por usuario.
 * Vista admin (IP, inicio, fin, duracion).
 */

import apiClient from "@api/client";
import type { SessionsListParams, SessionsListResponse } from "@api/types";

export const sessionsAPI = {
  /**
   * Listar conexiones (historial + activas) con paginacion.
   * @endpoint GET /api/v1/auth/ops/sessions
   * @permission admin:usuarios:sesiones:read
   */
  getSessions: async (
    params?: SessionsListParams,
  ): Promise<SessionsListResponse> => {
    const response = await apiClient.get<SessionsListResponse>(
      "/auth/ops/sessions",
      { params },
    );
    return response.data;
  },
};
