import { useQuery } from "@tanstack/react-query";
import { calidadLaboralAPI } from "@api/resources/catalogos/calidadLaboral.api";
import type { CalidadLaboralDetailResponse } from "@api/types";
import { calidadLaboralKeys } from "@features/admin/modules/catalogos/calidad-laboral/queries/calidadLaboral.keys";

export const useCalidadLaboralDetail = (id?: string, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<CalidadLaboralDetailResponse>({
    queryKey: calidadLaboralKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return calidadLaboralAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
