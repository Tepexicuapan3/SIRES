import { useQuery } from "@tanstack/react-query";
import { licenciasAPI } from "@api/resources/catalogos/licencias.api";
import type { LicenciaDetailResponse } from "@api/types";
import { licenciasKeys } from "@features/admin/modules/catalogos/licencias/queries/licencias.keys";

export const useLicenciaDetail = (id?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<LicenciaDetailResponse>({
    queryKey: licenciasKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return licenciasAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
