/**
 * useAdminRoles - React Query hooks for Roles Management
 *
 * Hooks para gestionar roles en el módulo de administración
 */

import { useQuery } from "@tanstack/react-query";
import { rolesAPI } from "@api/resources/roles.api";

/**
 * Hook para listar todos los roles
 *
 * @returns Lista de roles con metadata
 */
export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesAPI.getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutos - los roles no cambian frecuentemente
  });
};
