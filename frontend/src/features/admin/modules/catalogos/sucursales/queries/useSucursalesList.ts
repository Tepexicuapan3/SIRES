import { useQuery } from "@tanstack/react-query";
import { sucursalesAPI } from "@api/resources/catalogos/sucursales.api";
import type { SucursalesListParams, SucursalesListResponse } from "@api/types";
import { sucursalesKeys } from "@features/admin/modules/catalogos/sucursales/queries/sucursales.keys";

interface Options {
  enabled?: boolean;
}

export const useSucursalesList = (
  params?: SucursalesListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<SucursalesListResponse>({
    queryKey: sucursalesKeys.list(normalizedParams),
    queryFn: () => sucursalesAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
