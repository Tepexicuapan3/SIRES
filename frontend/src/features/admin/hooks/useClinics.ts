/**
 * useClinics Hook
 *
 * Hook para obtener catálogo de clínicas activas.
 * Cachea resultados automáticamente con TanStack Query.
 *
 * @example
 * const { data: clinicas, isLoading } = useClinics();
 */

import { useQuery } from "@tanstack/react-query";
import { clinicasAPI } from "@api/resources/clinicas.api";

export const useClinics = () => {
  return useQuery({
    queryKey: ["clinicas"], // Key para cache
    queryFn: clinicasAPI.getClinicas,
    staleTime: 10 * 60 * 1000, // 10 minutos - clínicas casi no cambian
    gcTime: 30 * 60 * 1000, // 30 minutos en cache antes de garbage collect
    retry: 2, // Reintentar 2 veces si falla
  });
};
