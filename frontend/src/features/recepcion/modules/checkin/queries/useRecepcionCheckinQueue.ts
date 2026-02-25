import { VISIT_STATUS } from "@api/types";
import { useVisitQueueByStatus } from "@features/flujo-clinico/queries/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@features/flujo-clinico/queries/useVisitRealtimeSync";

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

  const queueQuery = useVisitQueueByStatus(VISIT_STATUS.EN_ESPERA, {
    ...options,
    pageSize: 20,
  });

  return {
    ...queueQuery,
    connectionStatus: realtime.connectionStatus,
    lastSequence: realtime.lastSequence,
  };
};
