import { VISIT_STATUS } from "@api/types";
import { SOCKET_CONNECTION_STATUS } from "@/realtime/visits/client";
import { useVisitQueueByStatus } from "@/realtime/visits/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@/realtime/visits/useVisitRealtimeSync";

interface UseRecepcionCheckinQueueOptions {
  enabled?: boolean;
}

export const useRecepcionCheckinQueue = (
  options: UseRecepcionCheckinQueueOptions = {},
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
    realtime.connectionStatus !== SOCKET_CONNECTION_STATUS.CONNECTED;

  const queueQuery = useVisitQueueByStatus(VISIT_STATUS.EN_ESPERA, {
    ...options,
    pageSize: 20,
    refetchIntervalMs: shouldUsePollingFallback ? 5_000 : undefined,
  });

  return {
    ...queueQuery,
    connectionStatus: realtime.connectionStatus,
    lastSequence: realtime.lastSequence,
  };
};
