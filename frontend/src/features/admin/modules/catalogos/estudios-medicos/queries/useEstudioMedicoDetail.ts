import { useQuery } from "@tanstack/react-query";
import { estudiosMedicosAPI } from "@api/resources/catalogos/estudios-medicos.api";
import type { EstudioMedicoDetailResponse } from "@api/types";
import { estudiosMedicosKeys } from "@features/admin/modules/catalogos/estudios-medicos/queries/estudios-medicos.keys";

export const useEstudioMedicoDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<EstudioMedicoDetailResponse>({
    queryKey: estudiosMedicosKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return estudiosMedicosAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
