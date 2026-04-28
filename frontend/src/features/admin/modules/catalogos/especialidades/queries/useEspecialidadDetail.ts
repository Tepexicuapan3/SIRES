import { useQuery } from "@tanstack/react-query";
import { especialidadesAPI } from "@api/resources/catalogos/especialidades.api";
import type { EspecialidadDetailResponse } from "@api/types";
import { especialidadesKeys } from "@features/admin/modules/catalogos/especialidades/queries/especialidades.keys";

export const useEspecialidadDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<EspecialidadDetailResponse>({
    queryKey: especialidadesKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return especialidadesAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
