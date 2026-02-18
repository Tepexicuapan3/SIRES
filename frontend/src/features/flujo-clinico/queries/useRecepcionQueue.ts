import { VISIT_STATUS } from "@api/types";
import { useVisitQueueByStatus } from "@features/flujo-clinico/queries/useVisitQueueByStatus";

interface UseRecepcionQueueOptions {
  enabled?: boolean;
}

export const useRecepcionQueue = (options: UseRecepcionQueueOptions = {}) => {
  return useVisitQueueByStatus(VISIT_STATUS.EN_ESPERA, options);
};
