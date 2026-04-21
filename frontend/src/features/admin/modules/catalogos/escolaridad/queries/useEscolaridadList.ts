import { useQuery } from "@tanstack/react-query";
import { escolaridadAPI } from "@api/resources/catalogos/escolaridad.api";
import type { EscolaridadListParams, EscolaridadListResponse } from "@api/types";
import { escolaridadKeys } from "@features/admin/modules/catalogos/escolaridad/queries/escolaridad.keys";

interface Options {
  enabled?: boolean;
}

export const useEscolaridadList = (
  params?: EscolaridadListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<EscolaridadListResponse>({
    queryKey: escolaridadKeys.list(normalizedParams),
    queryFn: () => escolaridadAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
