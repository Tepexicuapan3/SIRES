import { useQuery } from "@tanstack/react-query";
import { contratosAPI } from "@api/resources/contratos.api";
import { CONTRATOS_KEYS } from "./useContratosList";

export const useContratosStats = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: CONTRATOS_KEYS.stats(),
    queryFn:  () => contratosAPI.getStats(),
    staleTime: 60_000,
    enabled:   options?.enabled ?? true,
  });
