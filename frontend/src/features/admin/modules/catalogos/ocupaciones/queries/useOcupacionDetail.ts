import { useQuery } from "@tanstack/react-query";
import { ocupacionesAPI } from "@api/resources/catalogos/ocupaciones.api";
import type { OcupacionDetailResponse } from "@api/types";
import { ocupacionesKeys } from "@features/admin/modules/catalogos/ocupaciones/queries/ocupaciones.keys";

export const useOcupacionDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<OcupacionDetailResponse>({
    queryKey: ocupacionesKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return ocupacionesAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
