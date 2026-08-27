import { useQuery } from "@tanstack/react-query";
import { discapacidadesAPI } from "@api/resources/catalogos/discapacidades.api";
import type { DiscapacidadDetailResponse } from "@api/types";
import { discapacidadesKeys } from "@features/admin/modules/catalogos/discapacidades/queries/discapacidades.keys";

export const useDiscapacidadDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<DiscapacidadDetailResponse>({
    queryKey: discapacidadesKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return discapacidadesAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
