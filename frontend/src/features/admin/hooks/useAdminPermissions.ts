/**
 * useAdminPermissions - React Query hooks for Permissions CRUD
 *
 * Hooks para gestionar permisos en el sistema RBAC 2.0
 * Incluye CRUD de permisos y user permission overrides
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionsAPI } from "@api/resources/permissions.api";
import type {
  CreatePermissionRequest,
  UpdatePermissionRequest,
  AddUserOverrideRequest,
} from "@api/types/permissions.types";

// ========== CRUD DE PERMISOS ==========

/**
 * Hook para obtener catálogo completo de permisos
 * Incluye agrupación por categoría
 */
export const usePermissionsCatalog = () => {
  return useQuery({
    queryKey: ["permissions", "catalog"],
    queryFn: permissionsAPI.getCatalog,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para listar todos los permisos (lista plana)
 */
export const usePermissions = () => {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: permissionsAPI.getPermissions,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener detalle de un permiso
 * @param id - ID del permiso
 */
export const usePermission = (id: number | null) => {
  return useQuery({
    queryKey: ["permissions", id],
    queryFn: () => permissionsAPI.getPermission(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para crear un nuevo permiso
 */
export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePermissionRequest) =>
      permissionsAPI.createPermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

/**
 * Hook para actualizar un permiso
 * NOTA: Solo permite modificar description y category
 * @param id - ID del permiso
 */
export const useUpdatePermission = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePermissionRequest) =>
      permissionsAPI.updatePermission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions", id] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

/**
 * Hook para eliminar un permiso
 * ADVERTENCIA: Elimina todas las asignaciones a roles
 */
export const useDeletePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => permissionsAPI.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

// ========== USER PERMISSION OVERRIDES ==========

/**
 * Hook para obtener overrides de un usuario
 * @param userId - ID del usuario
 */
export const useUserOverrides = (userId: number | null) => {
  return useQuery({
    queryKey: ["user-overrides", userId],
    queryFn: () => permissionsAPI.getUserOverrides(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos - overrides cambian más frecuentemente
  });
};

/**
 * Hook para obtener permisos efectivos de un usuario
 * Resultado de: (permisos de roles + ALLOW overrides) - DENY overrides
 * @param userId - ID del usuario
 */
export const useUserEffectivePermissions = (userId: number | null) => {
  return useQuery({
    queryKey: ["user-effective-permissions", userId],
    queryFn: () => permissionsAPI.getUserEffectivePermissions(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para agregar un override de permiso a un usuario
 * @param userId - ID del usuario
 */
export const useAddUserOverride = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddUserOverrideRequest) =>
      permissionsAPI.addUserOverride(userId, data),
    onSuccess: () => {
      // Invalidar overrides y permisos efectivos del usuario
      queryClient.invalidateQueries({ queryKey: ["user-overrides", userId] });
      queryClient.invalidateQueries({
        queryKey: ["user-effective-permissions", userId],
      });
    },
  });
};

/**
 * Hook para eliminar un override de permiso
 * @param userId - ID del usuario
 */
export const useRemoveUserOverride = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissionCode: string) =>
      permissionsAPI.removeUserOverride(userId, permissionCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-overrides", userId] });
      queryClient.invalidateQueries({
        queryKey: ["user-effective-permissions", userId],
      });
    },
  });
};

/**
 * Hook para invalidar cache de permisos
 * Útil después de operaciones masivas
 */
export const useInvalidatePermissionsCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId?: number) => permissionsAPI.invalidateCache(userId),
    onSuccess: () => {
      // Invalidar TODO el cache de permisos
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["user-overrides"] });
      queryClient.invalidateQueries({
        queryKey: ["user-effective-permissions"],
      });
    },
  });
};
