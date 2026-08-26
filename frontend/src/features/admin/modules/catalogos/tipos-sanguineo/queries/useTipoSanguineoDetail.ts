import { useQuery } from "@tanstack/react-query";
import { tiposSanguineoAPI } from "@api/resources/catalogos/tipos-sanguineo.api";
import type { TipoSanguineoDetailResponse } from "@api/types";
import { tiposSanguineoKeys } from "@features/admin/modules/catalogos/tipos-sanguineo/queries/tipos-sanguineo.keys";

export const useTipoSanguineoDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<TipoSanguineoDetailResponse>({
    queryKey: tiposSanguineoKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return tiposSanguineoAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
