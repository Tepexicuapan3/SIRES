import { useQuery } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type { CentroAtencionDetailResponse } from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

export const useCentroAtencionDetail = (
  centerId?: number,
  enabled = true,
) => {
  const isEnabled = enabled && Boolean(centerId);

  return useQuery<CentroAtencionDetailResponse>({
    queryKey: centrosAtencionKeys.detail(centerId!),
    queryFn: () => {
      if (!centerId) throw new Error("centerId es requerido");
      return centrosAtencionAPI.getById(centerId);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
