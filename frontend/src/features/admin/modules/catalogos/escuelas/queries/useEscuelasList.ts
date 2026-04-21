import { useQuery } from "@tanstack/react-query";
import { escuelasAPI } from "@api/resources/catalogos/escuelas.api";
import type { EscuelasListParams, EscuelasListResponse } from "@api/types";
import { escuelasKeys } from "@features/admin/modules/catalogos/escuelas/queries/escuelas.keys";

interface Options {
  enabled?: boolean;
}

export const useEscuelasList = (
  params?: EscuelasListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<EscuelasListResponse>({
    queryKey: escuelasKeys.list(normalizedParams),
    queryFn: () => escuelasAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
