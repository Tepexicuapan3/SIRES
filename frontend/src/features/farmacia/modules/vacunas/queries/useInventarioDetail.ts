import { useQuery } from "@tanstack/react-query";
import { inventarioVacunasAPI } from "@api/resources/farmacia/inventario-vacunas.api";
import type { InventarioVacunaDetailResponse } from "@api/types";
import { inventarioVacunasKeys } from "./inventario-vacunas.keys";

interface Options {
  enabled?: boolean;
}

export const useInventarioDetail = (id: number | null, options: Options = {}) => {
  return useQuery<InventarioVacunaDetailResponse>({
    queryKey: inventarioVacunasKeys.detail(id ?? 0),
    queryFn: () => inventarioVacunasAPI.getById(id!),
    staleTime: 30 * 1000,
    enabled: (options.enabled ?? true) && id !== null,
  });
};
