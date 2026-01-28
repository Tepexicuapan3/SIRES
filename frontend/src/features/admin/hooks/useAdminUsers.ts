/**
 * useAdminUsers - React Query hooks for User Management
 *
 * Hooks para gestionar usuarios y sus roles (multi-rol RBAC 2.0)
 *
 * ARQUITECTURA:
 * - TanStack Query v5 para cache automático
 * - Invalidación inteligente de cache (cuando cambia un usuario, invalida lista)
 * - Hooks separados para CRUD y gestión de roles
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type {
  UsersListParams,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest,
  SetPrimaryRoleRequest,
} from "@api/types";

// ========== CRUD DE USUARIOS ==========

/**
 * Hook para listar usuarios con paginación y filtros
 *
 * @param params - Filtros (search, estado, rol_id, paginación)
 * @returns Lista paginada de usuarios con metadata
 *
 * EJEMPLO:
 * ```ts
 * const { data, isLoading } = useUsers({ page: 1, page_size: 20, search: "juan" });
 * console.log(data.items); // Array de usuarios
 * console.log(data.total); // Total de registros
 * ```
 */
export const useUsers = (params?: UsersListParams) => {
  return useQuery({
    queryKey: ["users", params], // Cache por parámetros
    queryFn: () => usersAPI.getUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutos - lista puede cambiar frecuentemente
  });
};

/**
 * Hook para obtener detalle completo de un usuario
 *
 * Incluye:
 * - Datos completos del usuario (con auditoría)
 * - Roles asignados
 *
 * @param userId - ID del usuario (null = disabled)
 */
export const useUser = (userId: number | null) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersAPI.getUser(userId!),
    enabled: !!userId, // Solo ejecuta si userId existe
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para crear usuario
 *
 * IMPORTANTE: La respuesta incluye contraseña temporal que se muestra UNA SOLA VEZ.
 * Mostrar modal con la contraseña y permitir copiarla.
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersAPI.createUser(data),
    onSuccess: () => {
      // Invalidar lista de usuarios para refrescar
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

/**
 * Hook para actualizar datos básicos de usuario
 *
 * @param userId - ID del usuario a actualizar
 */
export const useUpdateUser = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => usersAPI.updateUser(userId, data),
    onSuccess: () => {
      // Invalidar cache del usuario específico y lista general
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

/**
 * Hook para activar usuario (cambiar estado a "A")
 *
 * @param userId - ID del usuario a activar
 */
export const useActivateUser = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersAPI.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

/**
 * Hook para desactivar usuario (cambiar estado a "B")
 *
 * El usuario no podrá iniciar sesión hasta que sea reactivado
 *
 * @param userId - ID del usuario a desactivar
 */
export const useDeactivateUser = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersAPI.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// ========== GESTIÓN DE ROLES (MULTI-ROL) ==========

/**
 * Hook para obtener roles asignados a un usuario
 *
 * @param userId - ID del usuario (null = disabled)
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
 *
 * Permite asignar varios roles de una sola vez (bulk assignment)
 *
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
      // Invalidar detalle del usuario (puede cambiar rol_primario)
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
};

/**
 * Hook para cambiar el rol primario de un usuario
 *
 * El rol primario determina:
 * - Landing page al iniciar sesión
 * - Permisos base del usuario
 *
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
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
};

/**
 * Hook para revocar (eliminar) un rol de un usuario
 *
 * REGLAS DE NEGOCIO (validadas en backend):
 * - No permitir revocar el último rol
 * - Si se revoca rol primario, auto-asigna otro como primario
 *
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
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
};
