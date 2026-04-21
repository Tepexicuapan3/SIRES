import { useQuery } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  CentrosAtencionExcepcionesListParams,
  CentrosAtencionExcepcionesListResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface Options {
  enabled?: boolean;
}

export const useCentroAtencionExcepcionesList = (
  params?: CentrosAtencionExcepcionesListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<CentrosAtencionExcepcionesListResponse>({
    queryKey: centrosAtencionKeys.exceptions.list(normalizedParams),
    queryFn: () => centrosAtencionAPI.getExcepciones(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
