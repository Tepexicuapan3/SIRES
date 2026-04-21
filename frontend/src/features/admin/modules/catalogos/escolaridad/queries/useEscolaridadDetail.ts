import { useQuery } from "@tanstack/react-query";
import { escolaridadAPI } from "@api/resources/catalogos/escolaridad.api";
import type { EscolaridadDetailResponse } from "@api/types";
import { escolaridadKeys } from "@features/admin/modules/catalogos/escolaridad/queries/escolaridad.keys";

export const useEscolaridadDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<EscolaridadDetailResponse>({
    queryKey: escolaridadKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return escolaridadAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
