import { useQuery } from "@tanstack/react-query";
import { tiposConsultaAPI } from "@api/resources/catalogos/tipos-consulta.api";
import type { TipoConsultaDetailResponse } from "@api/types";
import { tiposConsultaKeys } from "@features/admin/modules/catalogos/tipos-consulta/queries/tipos-consulta.keys";

export const useTipoConsultaDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<TipoConsultaDetailResponse>({
    queryKey: tiposConsultaKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return tiposConsultaAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
