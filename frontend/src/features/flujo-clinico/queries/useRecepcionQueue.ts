import { VISIT_STATUS } from "@api/types";
import { useVisitQueueByStatus } from "@features/flujo-clinico/queries/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@features/flujo-clinico/queries/useVisitRealtimeSync";

interface UseRecepcionQueueOptions {
  enabled?: boolean;
}

export const useRecepcionQueue = (options: UseRecepcionQueueOptions = {}) => {
  const enabled = options.enabled ?? true;

  useVisitRealtimeSync({
    enabled: enabled && import.meta.env.MODE !== "test",
    resyncParams: {
      page: 1,
      pageSize: 20,
      status: VISIT_STATUS.EN_ESPERA,
    },
  });

  return useVisitQueueByStatus(VISIT_STATUS.EN_ESPERA, options);
};
