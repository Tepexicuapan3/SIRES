/**
 * useAdminClinicas - React Query hooks for Clinicas Management
 *
 * Hooks para gestionar catálogo de clínicas
 */

import { useQuery } from "@tanstack/react-query";
import { clinicasAPI } from "@api/resources/clinicas.api";

/**
 * Hook para listar todas las clínicas activas
 *
 * @returns Lista de clínicas
 */
export const useClinicas = () => {
  return useQuery({
    queryKey: ["clinicas"],
    queryFn: () => clinicasAPI.getClinicas(),
    staleTime: 10 * 60 * 1000, // 10 minutos - las clínicas son datos casi estáticos
  });
};
