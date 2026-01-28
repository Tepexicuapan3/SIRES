import { useAuthSession } from "@features/auth/queries/useAuthSession";

/**
 * Evaluacion de permisos basada en la sesion cacheada.
 *
 * Razon empresarial:
 * - Centraliza checks RBAC y evita reglas divergentes en UI.
 * - Bypass admin explicito y auditable.
 * - Aisla la logica de permisos de los componentes de presentacion.
 */
export const usePermissions = () => {
  const { data: user } = useAuthSession();

  /**
   * Deteccion de admin para bypass explicito.
   * Prioriza permisos comodin y luego rol.
   */
  const isAdmin = (): boolean => {
    if (!user) return false;
    if (user.permissions.includes("*")) return true;
    return false;
  };

  /**
   * Check de permiso individual (RBAC).
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    return user.permissions.includes(permission);
  };

  /**
   * Check OR para multiples permisos.
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    return permissions.some((perm) => user.permissions.includes(perm));
  };

  /**
   * Check AND para multiples permisos.
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    return permissions.every((perm) => user.permissions.includes(perm));
  };

  return {
    permissions: user?.permissions ?? [],
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
  };
};
