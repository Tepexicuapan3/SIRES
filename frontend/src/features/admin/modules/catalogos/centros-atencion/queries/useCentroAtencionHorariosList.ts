import { useQuery } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  CentrosAtencionHorariosListParams,
  CentrosAtencionHorariosListResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface Options {
  enabled?: boolean;
}

export const useCentroAtencionHorariosList = (
  params?: CentrosAtencionHorariosListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<CentrosAtencionHorariosListResponse>({
    queryKey: centrosAtencionKeys.schedules.list(normalizedParams),
    queryFn: () => centrosAtencionAPI.getSchedules(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
