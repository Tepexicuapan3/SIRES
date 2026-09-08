import { useQuery } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { VisitPrescriptionItemsResponse } from "@api/types";

interface UsePrescriptionItemsOptions {
  enabled?: boolean;
}

export const usePrescriptionItems = (
  visitId: number | null | undefined,
  options: UsePrescriptionItemsOptions = {},
) => {
  return useQuery<VisitPrescriptionItemsResponse>({
    queryKey: ["doctor-consultation", "prescription-items", visitId],
    queryFn: () => visitsAPI.getPrescriptionItems(visitId as number),
    enabled: (options.enabled ?? true) && Boolean(visitId),
  });
};
