import { useQuery } from "@tanstack/react-query";
import { especialidadesAPI } from "@api/resources/catalogos/especialidades.api";
import type { EspecialidadesListParams, EspecialidadesListResponse } from "@api/types";
import { especialidadesKeys } from "@features/admin/modules/catalogos/especialidades/queries/especialidades.keys";

interface Options {
  enabled?: boolean;
}

export const useEspecialidadesList = (
  params?: EspecialidadesListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<EspecialidadesListResponse>({
    queryKey: especialidadesKeys.list(normalizedParams),
    queryFn: () => especialidadesAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
