/**
 * Hook para verificación de permisos RBAC 2.0
 *
 * Uso:
 * ```tsx
 * const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
 *
 * if (hasPermission("expedientes:create")) {
 *   // Mostrar botón de crear
 * }
 *
 * if (hasAnyPermission(["usuarios:create", "usuarios:update"])) {
 *   // Usuario puede crear O modificar
 * }
 * ```
 */

import { useAuthStore } from "@/store/authStore";

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  /**
   * Verifica si el usuario tiene un permiso específico
   *
   * @param permission - Código del permiso (ej: "expedientes:create")
   * @returns true si tiene el permiso o es admin
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Admin bypass: wildcard "*" = todos los permisos
    if (user.is_admin || user.permissions.includes("*")) {
      return true;
    }

    return user.permissions.includes(permission);
  };

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos (OR lógico)
   *
   * @param permissions - Array de códigos de permisos
   * @returns true si tiene al menos uno
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.is_admin || user.permissions.includes("*")) return true;

    return permissions.some((perm) => user.permissions.includes(perm));
  };

  /**
   * Verifica si el usuario tiene TODOS los permisos (AND lógico)
   *
   * @param permissions - Array de códigos de permisos
   * @returns true si tiene todos
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.is_admin || user.permissions.includes("*")) return true;

    return permissions.every((perm) => user.permissions.includes(perm));
  };

  /**
   * Verifica si el usuario es administrador
   */
  const isAdmin = (): boolean => {
    return user?.is_admin ?? false;
  };

  return {
    permissions: user?.permissions ?? [],
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
  };
};
