/**
 * useAdminPermissions - React Query hooks for Permissions CRUD
 *
 * Hooks para gestionar permisos en el sistema RBAC 2.0
 * Incluye CRUD de permisos y user permission overrides
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionsAPI } from "@api/resources/permissions.api";
import type {
  AddUserOverrideRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  UserOverride,
} from "@api/types";

// ========== CRUD DE PERMISOS ==========

/**
 * Hook para listar todos los permisos (lista plana)
 * Alias: usePermissionsCatalog usa la misma query
 */
export const usePermissions = () => {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: permissionsAPI.getPermissions,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Alias de usePermissions para compatibilidad con componentes
 * que esperan el nombre "catalog"
 */
export const usePermissionsCatalog = usePermissions;

/**
 * Hook para obtener detalle de un permiso
 * GET /permissions/:id
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
 * Hook para crear un nuevo permiso custom
 * POST /permissions
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
 * Hook para actualizar un permiso existente
 * PUT /permissions/:id
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
 * Hook para eliminar un permiso custom (baja lógica)
 * DELETE /permissions/:id
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

// TODO: Reemplazar stubs cuando existan endpoints reales.
export const useUserOverrides = (userId: number | null) => {
  return useQuery<{ overrides: UserOverride[] }>({
    queryKey: ["user-overrides", userId],
    queryFn: async () => ({ overrides: [] }),
    enabled: false,
    staleTime: 2 * 60 * 1000,
    initialData: { overrides: [] },
  });
};

type EffectivePermissionOverride = {
  permission_code: string;
  effect: "ALLOW" | "DENY";
  is_expired: boolean;
};

export const useUserEffectivePermissions = (userId: number | null) => {
  return useQuery<{
    permissions: string[];
    overrides: EffectivePermissionOverride[];
  }>({
    queryKey: ["user-effective-permissions", userId],
    queryFn: async () => ({ permissions: [], overrides: [] }),
    enabled: false,
    staleTime: 2 * 60 * 1000,
    initialData: { permissions: [], overrides: [] },
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
