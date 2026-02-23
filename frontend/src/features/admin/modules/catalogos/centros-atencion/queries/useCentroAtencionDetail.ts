import { useQuery } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type { CentroAtencionDetailResponse } from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

export const useCentroAtencionDetail = (centerId?: number, enabled = true) => {
  return useQuery<CentroAtencionDetailResponse>({
    queryKey: centrosAtencionKeys.detail(centerId ?? 0),
    queryFn: () => centrosAtencionAPI.getById(centerId ?? 0),
    enabled: enabled && Boolean(centerId),
    staleTime: 60 * 1000,
  });
};
