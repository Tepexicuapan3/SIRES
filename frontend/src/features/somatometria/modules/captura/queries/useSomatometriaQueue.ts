import { VISIT_STATUS } from "@api/types";
import { SOCKET_CONNECTION_STATUS } from "@realtime/visits/client";
import { useVisitQueueByStatus } from "@realtime/visits/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@realtime/visits/useVisitRealtimeSync";

interface UseSomatometriaQueueOptions {
  enabled?: boolean;
}

export const useSomatometriaQueue = (
  options: UseSomatometriaQueueOptions = {},
) => {
  const enabled = options.enabled ?? true;

  const realtime = useVisitRealtimeSync({
    enabled: enabled && import.meta.env.MODE !== "test",
    resyncParams: {
      page: 1,
      pageSize: 20,
      status: VISIT_STATUS.EN_SOMATOMETRIA,
    },
  });

  const shouldUsePollingFallback =
    enabled &&
    import.meta.env.MODE !== "test" &&
    (realtime.connectionStatus === SOCKET_CONNECTION_STATUS.DISCONNECTED ||
      realtime.connectionStatus === SOCKET_CONNECTION_STATUS.ERROR);

  return useVisitQueueByStatus(VISIT_STATUS.EN_SOMATOMETRIA, {
    ...options,
    refetchIntervalMs: shouldUsePollingFallback ? 2_000 : undefined,
  });
};
