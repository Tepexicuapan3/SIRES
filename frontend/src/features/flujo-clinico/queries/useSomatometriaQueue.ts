import { VISIT_STATUS } from "@api/types";
import { useVisitQueueByStatus } from "@features/flujo-clinico/queries/useVisitQueueByStatus";

interface UseSomatometriaQueueOptions {
  enabled?: boolean;
}

export const useSomatometriaQueue = (
  options: UseSomatometriaQueueOptions = {},
) => {
  return useVisitQueueByStatus(VISIT_STATUS.EN_SOMATOMETRIA, options);
};
