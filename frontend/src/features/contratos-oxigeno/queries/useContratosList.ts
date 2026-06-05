import { useQuery } from "@tanstack/react-query";
import { contratosAPI } from "@api/resources/contratos.api";
import type { ContratosListParams } from "@api/types";

export const CONTRATOS_KEYS = {
  all:   ["contratos-oxigeno"]                                           as const,
  list:  (params?: ContratosListParams) => ["contratos-oxigeno", "list", params] as const,
  stats: ()                             => ["contratos-oxigeno", "stats"]        as const,
};

export const useContratosList = (
  params?: ContratosListParams,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: CONTRATOS_KEYS.list(params),
    queryFn:  () => contratosAPI.getAll(params),
    staleTime: 30_000,
    enabled:   options?.enabled ?? true,
  });
