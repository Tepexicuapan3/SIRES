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
import { usePermissions } from "@features/auth/queries/usePermissions";

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export const PermissionGate = ({
  children,
  permission,
  anyOf,
  allOf,
  requireAdmin,
  fallback = null,
}: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } =
    usePermissions();

  const ruleCount = [
    requireAdmin ? 1 : 0,
    permission ? 1 : 0,
    anyOf?.length ? 1 : 0,
    allOf?.length ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  if (process.env.NODE_ENV !== "production" && ruleCount > 1) {
    console.warn(
      "PermissionGate: usa solo una regla a la vez (requireAdmin, permission, anyOf, allOf).",
    );
  }

  // Admin bypass
  if (requireAdmin) {
    return isAdmin() ? <>{children}</> : <>{fallback}</>;
  }

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // ANY of permissions (OR)
  if (anyOf?.length) {
    return hasAnyPermission(anyOf) ? <>{children}</> : <>{fallback}</>;
  }

  // ALL of permissions (AND)
  if (allOf?.length) {
    return hasAllPermissions(allOf) ? <>{children}</> : <>{fallback}</>;
  }

  // No permission specified - show by default
  return <>{children}</>;
};
