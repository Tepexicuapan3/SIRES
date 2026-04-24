import { useQuery } from "@tanstack/react-query";
import { vacunasAPI } from "@api/resources/catalogos/vacunas.api";
import type { VacunasListParams, VacunasListResponse } from "@api/types";
import { vacunasKeys } from "@features/admin/modules/catalogos/vacunas/queries/vacunas.keys";

interface Options {
  enabled?: boolean;
}

export const useVacunasList = (
  params?: VacunasListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<VacunasListResponse>({
    queryKey: vacunasKeys.list(normalizedParams),
    queryFn: () => vacunasAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
