import { useQuery } from "@tanstack/react-query";
import { sessionsAPI } from "@api/resources/sessions.api";
import type { SessionsListParams, SessionsListResponse } from "@api/types";
import { sessionsKeys } from "@/domains/auth-access/hooks/sessions/sessions.keys";

interface UseSessionsListOptions {
  enabled?: boolean;
}

/**
 * Query de listado de conexiones (historial + activas).
 *
 * Razon empresarial:
 * - Vista admin de control de sesion unica (IP, inicio, fin, duracion).
 * - Refetch periodico corto: es una vista de monitoreo, no un catalogo estatico.
 */
export const useSessionsList = (
  params?: SessionsListParams,
  options: UseSessionsListOptions = {},
) => {
  return useQuery<SessionsListResponse>({
    queryKey: sessionsKeys.list(params),
    queryFn: () => sessionsAPI.getSessions(params),
    staleTime: 15 * 1000,
    refetchInterval: options.enabled === false ? false : 30 * 1000,
    enabled: options.enabled ?? true,
  });
};
