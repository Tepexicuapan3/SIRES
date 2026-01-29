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
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";

export const useClinics = () => {
  return useQuery({
    queryKey: ["clinicas"], // Key para cache
    queryFn: () => centrosAtencionAPI.getAll({ isActive: true }),
    select: (data) => data.items,
    staleTime: 10 * 60 * 1000, // 10 minutos - clínicas casi no cambian
    gcTime: 30 * 60 * 1000, // 30 minutos en cache antes de garbage collect
    retry: 2, // Reintentar 2 veces si falla
  });
};
