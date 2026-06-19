import { useQuery } from "@tanstack/react-query";
import { contratosAPI } from "@api/resources/contratos.api";
import { useDebounce } from "@shared/hooks/useDebounce";

export const useBuscarDerechohabiente = (q: string) => {
  const debouncedQ = useDebounce(q.trim(), 400);

  return useQuery({
    queryKey: ["contratos-oxigeno", "buscar-derechohabiente", debouncedQ],
    queryFn:  () => contratosAPI.buscarDerechohabiente({ q: debouncedQ }),
    enabled:  debouncedQ.length >= 3,
    staleTime: 60_000,
  });
};
