import { useQuery } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { CieSearchParams, CieSearchResponse } from "@api/types";
import { doctorConsultationKeys } from "@features/consulta-medica/modules/atencion/queries/doctorConsultation.keys";

interface UseCieSearchOptions {
  enabled?: boolean;
}

export const useCieSearch = (
  params: CieSearchParams,
  options: UseCieSearchOptions = {},
) => {
  return useQuery<CieSearchResponse>({
    queryKey: doctorConsultationKeys.ciesSearch(params),
    queryFn: () => visitsAPI.searchCies(params),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
