import { useQuery } from "@tanstack/react-query";
import { estudiosAPI } from "@api/resources/catalogos/estudios.api";
import type { EstudioDetailResponse } from "@api/types";
import { estudiosKeys } from "@features/admin/modules/catalogos/estudios/queries/estudios.keys";

export const useEstudioDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<EstudioDetailResponse>({
    queryKey: estudiosKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return estudiosAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
