import { useQuery } from "@tanstack/react-query";
import { tiposAreasAPI } from "@api/resources/catalogos/tipos-areas.api";
import type { TiposAreasListParams, TiposAreasListResponse } from "@api/types";
import { tiposAreasKeys } from "@features/admin/modules/catalogos/tipos-areas/queries/tipos-areas.keys";

interface Options {
  enabled?: boolean;
}

export const useTiposAreasList = (
  params?: TiposAreasListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<TiposAreasListResponse>({
    queryKey: tiposAreasKeys.list(normalizedParams),
    queryFn: () => tiposAreasAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
