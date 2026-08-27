import { VISIT_STATUS } from "@api/types";
import { SOCKET_CONNECTION_STATUS } from "@realtime/visits/client";
import { useVisitQueueByStatus } from "@realtime/visits/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@realtime/visits/useVisitRealtimeSync";

interface UseSomatometriaWaitingQueueOptions {
  enabled?: boolean;
}

/** Cola de visitas en `en_espera` -- pacientes que ya hicieron check-in en
 * recepcion pero todavia NO pasaron a somatometria. Mismo endpoint
 * `GET /visits` que `useSomatometriaQueue` (solo cambia el filtro de
 * `status`), con el mismo patron de sync en tiempo real + polling fallback.
 * Se mantiene como hook hermano (no fusionado con `useSomatometriaQueue`)
 * porque la UI necesita mostrar ambas colas como secciones separadas, no
 * como una lista fusionada (a diferencia de `useDoctorQueue`, que si fusiona
 * dos estados en una sola lista). */
export const useSomatometriaWaitingQueue = (
  options: UseSomatometriaWaitingQueueOptions = {},
) => {
  const enabled = options.enabled ?? true;

  const realtime = useVisitRealtimeSync({
    enabled: enabled && import.meta.env.MODE !== "test",
    resyncParams: {
      page: 1,
      pageSize: 20,
      status: VISIT_STATUS.EN_ESPERA,
    },
  });

  const shouldUsePollingFallback =
    enabled &&
    import.meta.env.MODE !== "test" &&
    (realtime.connectionStatus === SOCKET_CONNECTION_STATUS.DISCONNECTED ||
      realtime.connectionStatus === SOCKET_CONNECTION_STATUS.ERROR);

  return useVisitQueueByStatus(VISIT_STATUS.EN_ESPERA, {
    ...options,
    refetchIntervalMs: shouldUsePollingFallback ? 2_000 : undefined,
  });
};
