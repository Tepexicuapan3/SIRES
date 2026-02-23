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
  const permissions = user?.permissions ?? [];
  const effectivePermissions = user?.effectivePermissions ?? permissions;
  const capabilities = user?.capabilities ?? {};
  const permissionDependenciesVersion = user?.permissionDependenciesVersion;

  /**
   * Deteccion de admin para bypass explicito.
   * Prioriza permisos comodin y luego rol.
   */
  const isAdmin = (): boolean => {
    if (!user) return false;
    if (permissions.includes("*")) return true;
    return false;
  };

  /**
   * Check de permiso individual (RBAC).
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    return permissions.includes(permission);
  };

  const hasEffectivePermission = (permission: string): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    return effectivePermissions.includes(permission);
  };

  /**
   * Check OR para multiples permisos.
   */
  const hasAnyPermission = (requestedPermissions: string[]): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    return requestedPermissions.some((permission) =>
      permissions.includes(permission),
    );
  };

  /**
   * Check AND para multiples permisos.
   */
  const hasAllPermissions = (requestedPermissions: string[]): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    return requestedPermissions.every((permission) =>
      permissions.includes(permission),
    );
  };

  const hasCapability = (capabilityKey: string): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    return Boolean(capabilities[capabilityKey]?.granted);
  };

  return {
    permissions,
    effectivePermissions,
    capabilities,
    permissionDependenciesVersion,
    hasPermission,
    hasEffectivePermission,
    hasAnyPermission,
    hasAllPermissions,
    hasCapability,
    isAdmin,
  };
};
