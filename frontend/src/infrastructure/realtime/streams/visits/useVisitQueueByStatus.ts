import { useQuery } from "@tanstack/react-query";

import { visitsAPI } from "@api/resources/visits.api";
import type { VisitStatus, VisitsListResponse } from "@api/types";
import { visitFlowKeys } from "@realtime/streams/visits/query-keys";

interface UseVisitQueueByStatusOptions {
  enabled?: boolean;
  refetchIntervalMs?: number;
  page?: number;
  pageSize?: number;
  date?: string;
  doctorId?: number;
}

export const useVisitQueueByStatus = (
  status?: VisitStatus,
  options: UseVisitQueueByStatusOptions = {},
) => {
  const params = {
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 20,
    status,
    date: options.date,
    doctorId: options.doctorId,
  };

  return useQuery<VisitsListResponse>({
    queryKey: visitFlowKeys.list(params),
    queryFn: () => visitsAPI.getAll(params),
    staleTime: 30 * 1000,
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchIntervalMs,
  });
};
