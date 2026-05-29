import { useQuery } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { VisitStatusLogItem } from "@api/types";

export function useVisitStatusLog(visitId: number | null | undefined, enabled = true) {
  return useQuery<VisitStatusLogItem[]>({
    queryKey: ["visit-status-log", visitId],
    queryFn: async () => {
      const res = await visitsAPI.getStatusLog(visitId!);
      return res.items;
    },
    enabled: enabled && visitId != null,
    staleTime: 30_000,
  });
}
