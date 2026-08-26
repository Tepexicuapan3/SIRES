import { useQuery } from "@tanstack/react-query";
import { tiposAutorizacionAPI } from "@api/resources/catalogos/tipos-autorizacion.api";
import type { TipoAutorizacionDetailResponse } from "@api/types";
import { tiposAutorizacionKeys } from "@features/admin/modules/catalogos/tipos-autorizacion/queries/tipos-autorizacion.keys";

export const useTipoAutorizacionDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<TipoAutorizacionDetailResponse>({
    queryKey: tiposAutorizacionKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return tiposAutorizacionAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
