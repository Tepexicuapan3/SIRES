import { useVisitQueueByStatus } from "@features/flujo-clinico/queries/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@features/flujo-clinico/queries/useVisitRealtimeSync";
import { SOCKET_CONNECTION_STATUS } from "@features/flujo-clinico/queries/visit-realtime.client";

interface UseRecepcionAgendaQueueOptions {
  enabled?: boolean;
}

export const useRecepcionAgendaQueue = (
  options: UseRecepcionAgendaQueueOptions = {},
) => {
  const enabled = options.enabled ?? true;

  const realtime = useVisitRealtimeSync({
    enabled: enabled && import.meta.env.MODE !== "test",
    resyncParams: {
      page: 1,
      pageSize: 50,
    },
  });

  const shouldUsePollingFallback =
    enabled &&
    import.meta.env.MODE !== "test" &&
    realtime.connectionStatus !== SOCKET_CONNECTION_STATUS.CONNECTED;

  const queueQuery = useVisitQueueByStatus(undefined, {
    ...options,
    pageSize: 50,
    refetchIntervalMs: shouldUsePollingFallback ? 5_000 : undefined,
  });

  return {
    ...queueQuery,
    connectionStatus: realtime.connectionStatus,
    lastSequence: realtime.lastSequence,
  };
};
