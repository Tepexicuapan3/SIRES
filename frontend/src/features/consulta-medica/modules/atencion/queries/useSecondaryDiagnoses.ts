import { useQuery } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { VisitSecondaryDiagnosesResponse } from "@api/types";

interface UseSecondaryDiagnosesOptions {
  enabled?: boolean;
}

export const useSecondaryDiagnoses = (
  visitId: number | null | undefined,
  options: UseSecondaryDiagnosesOptions = {},
) => {
  return useQuery<VisitSecondaryDiagnosesResponse>({
    queryKey: ["doctor-consultation", "secondary-diagnoses", visitId],
    queryFn: () => visitsAPI.getSecondaryDiagnoses(visitId as number),
    enabled: (options.enabled ?? true) && Boolean(visitId),
  });
};
