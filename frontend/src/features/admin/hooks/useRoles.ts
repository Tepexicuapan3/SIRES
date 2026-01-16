/**
 * useRoles - React Query hooks for Roles CRUD
 *
 * Hooks para gestionar roles en el sistema RBAC 2.0
 * Usa TanStack Query para cache automático y optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesAPI } from "@api/resources/roles.api";
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignPermissionsRequest,
} from "@api/types/roles.types";

/**
 * Hook para listar todos los roles
 * Cachea resultados automáticamente
 *
 * IMPORTANTE: rolesAPI.getRoles() retorna {total, roles[]}
 * Este hook extrae solo el array de roles usando `select`
 * para mantener compatibilidad con componentes existentes
 */
export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: rolesAPI.getRoles,
    staleTime: 5 * 60 * 1000, // 5 minutos - los roles no cambian frecuentemente
    select: (data) => data.roles, // Extraer solo el array de roles
  });
};

/**
 * Hook para obtener detalle de un rol específico
 * @param id - ID del rol
 */
export const useRole = (id: number | null) => {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: () => rolesAPI.getRole(id!),
    enabled: !!id, // Solo ejecuta si id existe
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para crear un nuevo rol
 * Invalida cache automáticamente después de crear
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesAPI.createRole(data),
    onSuccess: () => {
      // Invalidar cache de roles para refrescar lista
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

/**
 * Hook para actualizar un rol existente
 * @param id - ID del rol a actualizar
 */
export const useUpdateRole = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRoleRequest) => rolesAPI.updateRole(id, data),
    onSuccess: () => {
      // Invalidar cache del rol específico y lista general
      queryClient.invalidateQueries({ queryKey: ["roles", id] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

/**
 * Hook para eliminar un rol
 * ADVERTENCIA: Solo funciona si el rol no tiene usuarios asignados
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rolesAPI.deleteRole(id),
    onSuccess: () => {
      // Invalidar cache completo de roles
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

/**
 * Hook para asignar múltiples permisos a un rol
 * Optimizado para bulk assignment
 */
export const useAssignPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignPermissionsRequest) =>
      rolesAPI.assignPermissions(data),
    onSuccess: (_, variables) => {
      // Invalidar cache del rol específico
      queryClient.invalidateQueries({
        queryKey: ["roles", variables.role_id],
      });
      // Invalidar permisos del rol
      queryClient.invalidateQueries({
        queryKey: ["role-permissions", variables.role_id],
      });
    },
  });
};

/**
 * Hook para revocar un permiso de un rol
 * @param roleId - ID del rol
 */
export const useRevokePermission = (roleId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissionId: number) =>
      rolesAPI.revokePermission(roleId, permissionId),
    onSuccess: () => {
      // Invalidar cache del rol específico
      queryClient.invalidateQueries({ queryKey: ["roles", roleId] });
      queryClient.invalidateQueries({
        queryKey: ["role-permissions", roleId],
      });
    },
  });
};
