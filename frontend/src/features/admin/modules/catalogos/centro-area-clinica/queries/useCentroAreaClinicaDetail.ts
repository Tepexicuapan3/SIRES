import { useQuery } from "@tanstack/react-query";
import { centroAreaClinicaAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { CentroAreaClinicaDetailResponse } from "@api/types";
import { centroAreaClinicaKeys } from "@features/admin/modules/catalogos/centro-area-clinica/queries/centro-area-clinica.keys";

export const useCentroAreaClinicaDetail = (
  centerId: number | undefined,
  areaId: number | undefined,
  enabled = true,
) => {
  return useQuery<CentroAreaClinicaDetailResponse>({
    queryKey: centroAreaClinicaKeys.detail(centerId ?? 0, areaId ?? 0),
    queryFn: () => centroAreaClinicaAPI.getByKey(centerId!, areaId!),
    staleTime: 60 * 1000,
    enabled: enabled && Boolean(centerId) && Boolean(areaId),
  });
};
