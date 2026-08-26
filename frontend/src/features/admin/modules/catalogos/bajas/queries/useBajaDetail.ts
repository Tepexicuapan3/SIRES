import { useQuery } from "@tanstack/react-query";
import { bajasAPI } from "@api/resources/catalogos/bajas.api";
import type { BajaDetailResponse } from "@api/types";
import { bajasKeys } from "@features/admin/modules/catalogos/bajas/queries/bajas.keys";

export const useBajaDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<BajaDetailResponse>({
    queryKey: bajasKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return bajasAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
