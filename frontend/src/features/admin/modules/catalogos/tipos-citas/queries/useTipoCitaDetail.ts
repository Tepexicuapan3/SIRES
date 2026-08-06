import { useQuery } from "@tanstack/react-query";
import { tiposCitasAPI } from "@api/resources/catalogos/tipos-citas.api";
import type { TipoCitaDetailResponse } from "@api/types";
import { tiposCitasKeys } from "@features/admin/modules/catalogos/tipos-citas/queries/tipos-citas.keys";

export const useTipoCitaDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<TipoCitaDetailResponse>({
    queryKey: tiposCitasKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return tiposCitasAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
