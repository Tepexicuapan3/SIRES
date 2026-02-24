import { VISIT_STATUS } from "@api/types";
import { useVisitQueueByStatus } from "@features/flujo-clinico/queries/useVisitQueueByStatus";
import { useVisitRealtimeSync } from "@features/flujo-clinico/queries/useVisitRealtimeSync";

interface UseSomatometriaQueueOptions {
  enabled?: boolean;
}

export const useSomatometriaQueue = (
  options: UseSomatometriaQueueOptions = {},
) => {
  const enabled = options.enabled ?? true;

  useVisitRealtimeSync({
    enabled: enabled && import.meta.env.MODE !== "test",
    resyncParams: {
      page: 1,
      pageSize: 20,
      status: VISIT_STATUS.EN_SOMATOMETRIA,
    },
  });

  return useVisitQueueByStatus(VISIT_STATUS.EN_SOMATOMETRIA, {
    ...options,
    refetchIntervalMs:
      enabled && import.meta.env.MODE !== "test" ? 2_000 : undefined,
  });
};
