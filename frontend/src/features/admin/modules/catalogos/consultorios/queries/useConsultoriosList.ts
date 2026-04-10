import { useQuery } from "@tanstack/react-query";
import { consultoriosAPI } from "@api/resources/catalogos/consultorios.api";
import type {
  ConsultoriosListParams,
  ConsultoriosListResponse,
} from "@api/types";
import { consultoriosKeys } from "@features/admin/modules/catalogos/consultorios/queries/consultorios.keys";

interface UseConsultoriosListOptions {
  enabled?: boolean;
}

export const useConsultoriosList = (
  params?: ConsultoriosListParams,
  options: UseConsultoriosListOptions = {},
) => {
  return useQuery<ConsultoriosListResponse>({
    queryKey: consultoriosKeys.list(params),
    queryFn: () => consultoriosAPI.getAll(params),
    staleTime: 5 * 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
