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

import { ReactNode } from "react";
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

  // Admin bypass
  if (requireAdmin) {
    return isAdmin() ? <>{children}</> : <>{fallback}</>;
  }

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // ANY of permissions (OR)
  if (anyOf) {
    return hasAnyPermission(anyOf) ? <>{children}</> : <>{fallback}</>;
  }

  // ALL of permissions (AND)
  if (allOf) {
    return hasAllPermissions(allOf) ? <>{children}</> : <>{fallback}</>;
  }

  // No permission specified - show by default
  return <>{children}</>;
};
