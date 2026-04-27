import { useQuery } from "@tanstack/react-query";
import { areasClinicasAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { AreaClinicaDetailResponse } from "@api/types";
import { areasClinicasKeys } from "@features/admin/modules/catalogos/areas-clinicas/queries/areas-clinicas.keys";

export const useAreaClinicaDetail = (areaId?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(areaId);

  return useQuery<AreaClinicaDetailResponse>({
    queryKey: areasClinicasKeys.detail(areaId!),
    queryFn: () => {
      if (!areaId) throw new Error("areaId es requerido");
      return areasClinicasAPI.getById(areaId);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
