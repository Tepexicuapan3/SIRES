import { useQuery } from "@tanstack/react-query";
import { religionesAPI } from "@api/resources/catalogos/religiones.api";
import type { ReligionDetailResponse } from "@api/types";
import { religionesKeys } from "@features/admin/modules/catalogos/religiones/queries/religiones.keys";

export const useReligionDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<ReligionDetailResponse>({
    queryKey: religionesKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return religionesAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
