import { VISIT_STATUS } from "@api/types";
import { useVisitQueueByStatus } from "@features/flujo-clinico/queries/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@features/flujo-clinico/queries/useVisitRealtimeSync";
import { SOCKET_CONNECTION_STATUS } from "@features/flujo-clinico/queries/visit-realtime.client";

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
    realtime.connectionStatus !== SOCKET_CONNECTION_STATUS.CONNECTED;

  return useVisitQueueByStatus(VISIT_STATUS.EN_SOMATOMETRIA, {
    ...options,
    refetchIntervalMs: shouldUsePollingFallback ? 2_000 : undefined,
  });
};
