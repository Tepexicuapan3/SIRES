import { useQuery } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { VisitStatus, VisitsListResponse } from "@api/types";
import { visitFlowKeys } from "@features/flujo-clinico/queries/visit-flow.keys";

interface UseVisitQueueByStatusOptions {
  enabled?: boolean;
  refetchIntervalMs?: number;
}

export const useVisitQueueByStatus = (
  status?: VisitStatus,
  options: UseVisitQueueByStatusOptions = {},
) => {
  return useQuery<VisitsListResponse>({
    queryKey: visitFlowKeys.list({ status }),
    queryFn: () => visitsAPI.getAll({ page: 1, pageSize: 20, status }),
    staleTime: 30 * 1000,
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchIntervalMs,
  });
};
