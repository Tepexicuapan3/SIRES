import { useQuery } from "@tanstack/react-query";
import { turnosAPI } from "@api/resources/catalogos/turnos.api";
import type { TurnosListParams, TurnosListResponse } from "@api/types";
import { turnosKeys } from "@features/admin/modules/catalogos/turnos/queries/turnos.keys";

interface Options {
  enabled?: boolean;
}

export const useTurnosList = (
  params?: TurnosListParams,
  options: Options = {},
) => {
  const normalizedParams = params ?? {};

  return useQuery<TurnosListResponse>({
    queryKey: turnosKeys.list(normalizedParams),
    queryFn: () => turnosAPI.getAll(normalizedParams),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
