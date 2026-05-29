import { useQuery } from "@tanstack/react-query";
import { tipoPersonalAPI } from "@api/resources/catalogos/tipo-personal.api";
import type { TipoPersonalListParams, TipoPersonalListResponse } from "@api/types";
import { tipoPersonalKeys } from "@features/admin/modules/catalogos/tipo-personal/queries/tipo-personal.keys";

interface Options {
  enabled?: boolean;
}

export const useTipoPersonalList = (
  params?: TipoPersonalListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<TipoPersonalListResponse>({
    queryKey: tipoPersonalKeys.list(normalizedParams),
    queryFn: () => tipoPersonalAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
