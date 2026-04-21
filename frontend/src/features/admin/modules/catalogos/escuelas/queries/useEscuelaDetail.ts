import { useQuery } from "@tanstack/react-query";
import { escuelasAPI } from "@api/resources/catalogos/escuelas.api";
import type { EscuelaDetailResponse } from "@api/types";
import { escuelasKeys } from "@features/admin/modules/catalogos/escuelas/queries/escuelas.keys";

export const useEscuelaDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<EscuelaDetailResponse>({
    queryKey: escuelasKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return escuelasAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
