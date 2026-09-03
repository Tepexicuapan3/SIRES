import { useQuery } from "@tanstack/react-query";
import { tiposResidenciaAPI } from "@api/resources/catalogos/tipos-residencia.api";
import type { TipoResidenciaDetailResponse } from "@api/types";
import { tiposResidenciaKeys } from "@features/admin/modules/catalogos/tipos-residencia/queries/tipos-residencia.keys";

export const useTipoResidenciaDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<TipoResidenciaDetailResponse>({
    queryKey: tiposResidenciaKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return tiposResidenciaAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
