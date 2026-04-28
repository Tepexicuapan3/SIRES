import { useQuery } from "@tanstack/react-query";
import { centroAreaClinicaAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { CentrosAreasClinicasListParams, CentrosAreasClinicasListResponse } from "@api/types";
import { centroAreaClinicaKeys } from "@features/admin/modules/catalogos/centro-area-clinica/queries/centro-area-clinica.keys";

interface Options {
  enabled?: boolean;
}

export const useCentrosAreasClinicasList = (
  params?: CentrosAreasClinicasListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<CentrosAreasClinicasListResponse>({
    queryKey: centroAreaClinicaKeys.list(normalizedParams),
    queryFn: () => centroAreaClinicaAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
