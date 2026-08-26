import { useQuery } from "@tanstack/react-query";
import { origenConsultaAPI } from "@api/resources/catalogos/origenConsulta.api";
import type { OrigenConsultaDetailResponse } from "@api/types";
import { origenConsultaKeys } from "@features/admin/modules/catalogos/origen-consulta/queries/origenConsulta.keys";

export const useOrigenConsultaDetail = (id?: string, enabled = true) => {
  const isEnabled = enabled && Boolean(id);

  return useQuery<OrigenConsultaDetailResponse>({
    queryKey: origenConsultaKeys.detail(id!),
    queryFn: () => {
      if (!id) throw new Error("id es requerido");
      return origenConsultaAPI.getById(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
