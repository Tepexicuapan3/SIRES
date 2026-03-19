import { SOCKET_CONNECTION_STATUS } from "@/realtime/visits/client";
import { useVisitQueueByStatus } from "@/realtime/visits/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@/realtime/visits/useVisitRealtimeSync";

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
    (realtime.connectionStatus === SOCKET_CONNECTION_STATUS.DISCONNECTED ||
      realtime.connectionStatus === SOCKET_CONNECTION_STATUS.ERROR);

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
