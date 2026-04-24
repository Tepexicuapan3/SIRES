import { useQuery } from "@tanstack/react-query";
import { inventarioVacunasAPI } from "@api/resources/farmacia/inventario-vacunas.api";
import type { InventarioVacunaListParams, InventarioVacunaListResponse } from "@api/types";
import { inventarioVacunasKeys } from "./inventario-vacunas.keys";

interface Options {
  enabled?: boolean;
}

export const useInventarioList = (params?: InventarioVacunaListParams, options: Options = {}) => {
  const normalizedParams = params ?? {};

  return useQuery<InventarioVacunaListResponse>({
    queryKey: inventarioVacunasKeys.list(normalizedParams),
    queryFn: () => inventarioVacunasAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
