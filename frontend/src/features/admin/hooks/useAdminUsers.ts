/**
 * useAdminUsers - React Query hooks for User Multi-Role Management
 *
 * Hooks para gestionar múltiples roles de usuarios
 * Fase 3 del plan RBAC 2.0
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type {
  AssignRolesRequest,
  SetPrimaryRoleRequest,
} from "@api/types/users.types";

/**
 * Hook para obtener roles asignados a un usuario
 * @param userId - ID del usuario
 */
export const useUserRoles = (userId: number | null) => {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: () => usersAPI.getUserRoles(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Hook para asignar múltiples roles a un usuario
 * @param userId - ID del usuario
 */
export const useAssignRoles = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignRolesRequest) =>
      usersAPI.assignRoles(userId, data),
    onSuccess: () => {
      // Invalidar cache de roles del usuario
      queryClient.invalidateQueries({ queryKey: ["user-roles", userId] });
      // Invalidar permisos efectivos (porque cambió su rol)
      queryClient.invalidateQueries({
        queryKey: ["user-effective-permissions", userId],
      });
    },
  });
};

/**
 * Hook para cambiar el rol primario de un usuario
 * @param userId - ID del usuario
 */
export const useSetPrimaryRole = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetPrimaryRoleRequest) =>
      usersAPI.setPrimaryRole(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles", userId] });
      // El rol primario afecta la landing page y permisos efectivos
      queryClient.invalidateQueries({
        queryKey: ["user-effective-permissions", userId],
      });
    },
  });
};

/**
 * Hook para revocar un rol de un usuario
 * NOTA: No permite revocar el último rol
 * @param userId - ID del usuario
 */
export const useRevokeRole = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: number) => usersAPI.revokeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles", userId] });
      queryClient.invalidateQueries({
        queryKey: ["user-effective-permissions", userId],
      });
    },
  });
};
