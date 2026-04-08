/**
 * PermissionGate - Componente para mostrar/ocultar UI basado en permisos
 *
 * Uso:
 * ```tsx
 * <PermissionGate permission="clinico:expedientes:create">
 *   <Button>Crear Expediente</Button>
 * </PermissionGate>
 *
 * <PermissionGate
 *   anyOf={["admin:gestion:usuarios:create", "admin:gestion:usuarios:update"]}
 *   fallback={<div>No tienes permisos</div>}
 * >
 *   <UserForm />
 * </PermissionGate>
 * ```
 */

import type { ReactNode } from "react";
import { usePermissions } from "@/domains/auth-access/hooks/usePermissions";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";

interface PermissionGateProps {
  children: ReactNode;
  requiredCapability?: string;
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  requireAdmin?: boolean;
  dependencyAware?: boolean;
  fallback?: ReactNode;
}

export const PermissionGate = ({
  children,
  requiredCapability,
  permission,
  anyOf,
  allOf,
  requireAdmin,
  dependencyAware = false,
  fallback = null,
}: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } =
    usePermissions();
  const { hasCapability, hasEffectivePermission, hasEffectiveRequirement } =
    usePermissionDependencies();

  const ruleCount = [
    requireAdmin ? 1 : 0,
    requiredCapability ? 1 : 0,
    permission ? 1 : 0,
    anyOf?.length ? 1 : 0,
    allOf?.length ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  if (import.meta.env.DEV && ruleCount > 1) {
    console.warn(
      "PermissionGate: usa solo una regla a la vez (requireAdmin, requiredCapability, permission, anyOf, allOf).",
    );
  }

  // Admin bypass
  if (requireAdmin) {
    return isAdmin() ? <>{children}</> : <>{fallback}</>;
  }

  if (requiredCapability) {
    return hasCapability(requiredCapability) ? (
      <>{children}</>
    ) : (
      <>{fallback}</>
    );
  }

  // Single permission check
  if (permission) {
    const canAccess = dependencyAware
      ? hasEffectivePermission(permission)
      : hasPermission(permission);
    return canAccess ? <>{children}</> : <>{fallback}</>;
  }

  // ANY of permissions (OR)
  if (anyOf?.length) {
    const canAccess = dependencyAware
      ? hasEffectiveRequirement({ anyOf })
      : hasAnyPermission(anyOf);
    return canAccess ? <>{children}</> : <>{fallback}</>;
  }

  // ALL of permissions (AND)
  if (allOf?.length) {
    const canAccess = dependencyAware
      ? hasEffectiveRequirement({ allOf })
      : hasAllPermissions(allOf);
    return canAccess ? <>{children}</> : <>{fallback}</>;
  }

  // No permission specified - show by default
  return <>{children}</>;
};
