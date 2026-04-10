import { useQuery } from "@tanstack/react-query";
import { consultoriosAPI } from "@api/resources/catalogos/consultorios.api";
import type { ConsultorioDetailResponse } from "@api/types";
import { consultoriosKeys } from "@features/admin/modules/catalogos/consultorios/queries/consultorios.keys";

export const useConsultorioDetail = (
  consultorioId?: number,
  enabled = true,
) => {
  return useQuery<ConsultorioDetailResponse>({
    queryKey: consultoriosKeys.detail(consultorioId ?? 0),
    queryFn: () => consultoriosAPI.getById(consultorioId ?? 0),
    enabled: enabled && Boolean(consultorioId),
    staleTime: 60 * 1000,
  });
};
