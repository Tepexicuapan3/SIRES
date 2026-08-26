import { useQuery } from "@tanstack/react-query";
import { sucursalesAPI } from "@api/resources/catalogos/sucursales.api";
import type { SucursalDetailResponse } from "@api/types";
import { sucursalesKeys } from "@features/admin/modules/catalogos/sucursales/queries/sucursales.keys";

export const useSucursalDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<SucursalDetailResponse>({
    queryKey: sucursalesKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return sucursalesAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
