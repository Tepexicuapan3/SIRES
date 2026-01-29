/**
 * useAdminClinicas - React Query hooks for Clinicas Management
 *
 * Hooks para gestionar catálogo de clínicas
 */

import { useQuery } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";

/**
 * Hook para listar todas las clínicas activas
 *
 * @returns Lista de clínicas
 */
export const useClinicas = () => {
  return useQuery({
    queryKey: ["clinicas"],
    queryFn: () => centrosAtencionAPI.getAll({ isActive: true }),
    select: (data) => data.items,
    staleTime: 10 * 60 * 1000, // 10 minutos - las clínicas son datos casi estáticos
  });
};
