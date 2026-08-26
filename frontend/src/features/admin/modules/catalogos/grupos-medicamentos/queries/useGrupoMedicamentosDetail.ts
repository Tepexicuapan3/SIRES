import { useQuery } from "@tanstack/react-query";
import { gruposMedicamentosAPI } from "@api/resources/catalogos/grupos-medicamentos.api";
import type { GrupoMedicamentosDetailResponse } from "@api/types";
import { gruposMedicamentosKeys } from "@features/admin/modules/catalogos/grupos-medicamentos/queries/grupos-medicamentos.keys";

export const useGrupoMedicamentosDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<GrupoMedicamentosDetailResponse>({
    queryKey: gruposMedicamentosKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return gruposMedicamentosAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
