import { useQuery } from "@tanstack/react-query";
import { enfermedadesAPI } from "@api/resources/catalogos/enfermedades.api";
import type { EnfermedadDetailResponse } from "@api/types";
import { enfermedadesKeys } from "@features/admin/modules/catalogos/enfermedades/queries/enfermedades.keys";

export const useEnfermedadDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<EnfermedadDetailResponse>({
    queryKey: enfermedadesKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return enfermedadesAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
