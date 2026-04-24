import { useQuery } from "@tanstack/react-query";
import { vacunasAPI } from "@api/resources/catalogos/vacunas.api";
import type { VacunaDetailResponse } from "@api/types";
import { vacunasKeys } from "@features/admin/modules/catalogos/vacunas/queries/vacunas.keys";

export const useVacunaDetail = (vacunaId?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(vacunaId);

  return useQuery<VacunaDetailResponse>({
    queryKey: vacunasKeys.detail(vacunaId!),
    queryFn: () => {
      if (!vacunaId) throw new Error("vacunaId es requerido");
      return vacunasAPI.getById(vacunaId);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
