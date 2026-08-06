import { useQuery } from "@tanstack/react-query";
import { tiposCitasAPI } from "@api/resources/catalogos/tipos-citas.api";
import type { TiposCitasListParams, TiposCitasListResponse } from "@api/types";
import { tiposCitasKeys } from "@features/admin/modules/catalogos/tipos-citas/queries/tipos-citas.keys";

interface Options {
  enabled?: boolean;
}

export const useTiposCitasList = (
  params?: TiposCitasListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<TiposCitasListResponse>({
    queryKey: tiposCitasKeys.list(normalizedParams),
    queryFn: () => tiposCitasAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
