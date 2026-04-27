import { useQuery } from "@tanstack/react-query";
import { areasClinicasAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { AreasClinicasListParams, AreasClinicasListResponse } from "@api/types";
import { areasClinicasKeys } from "@features/admin/modules/catalogos/areas-clinicas/queries/areas-clinicas.keys";

interface Options {
  enabled?: boolean;
}

export const useAreasClinicasList = (
  params?: AreasClinicasListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<AreasClinicasListResponse>({
    queryKey: areasClinicasKeys.list(normalizedParams),
    queryFn: () => areasClinicasAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
