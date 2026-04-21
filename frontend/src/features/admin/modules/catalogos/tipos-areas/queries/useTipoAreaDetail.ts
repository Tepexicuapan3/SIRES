import { useQuery } from "@tanstack/react-query";
import { tiposAreasAPI } from "@api/resources/catalogos/tipos-areas.api";
import type { TipoAreaDetailResponse } from "@api/types";
import { tiposAreasKeys } from "@features/admin/modules/catalogos/tipos-areas/queries/tipos-areas.keys";

export const useTipoAreaDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<TipoAreaDetailResponse>({
    queryKey: tiposAreasKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return tiposAreasAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
