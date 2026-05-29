import { useQuery } from "@tanstack/react-query";
import { tipoPersonalAPI } from "@api/resources/catalogos/tipo-personal.api";
import type { TipoPersonalDetailResponse } from "@api/types";
import { tipoPersonalKeys } from "@features/admin/modules/catalogos/tipo-personal/queries/tipo-personal.keys";

export const useTipoPersonalDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<TipoPersonalDetailResponse>({
    queryKey: tipoPersonalKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return tipoPersonalAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
