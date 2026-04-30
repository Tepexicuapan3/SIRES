import { useQuery } from "@tanstack/react-query";
import { centroAreaClinicaAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { CentrosAreasClinicasListParams, CentrosAreasClinicasListResponse } from "@api/types";
import { areasClinicasKeys } from "@features/admin/modules/catalogos/areas-clinicas/queries/areas-clinicas.keys";

interface Options {
  enabled?: boolean;
}

export const useCentroAreasClinicasList = (
  params?: CentrosAreasClinicasListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};
  const hasCenterId = !!normalizedParams.centerId;

  return useQuery<CentrosAreasClinicasListResponse>({
    queryKey: areasClinicasKeys.centroAreasClinicas(normalizedParams),
    queryFn: () => centroAreaClinicaAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: (options.enabled ?? true) && hasCenterId, 
  });
};
