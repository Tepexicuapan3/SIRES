/**
 * PermissionGate - Componente para mostrar/ocultar UI basado en permisos
 *
 * Uso:
 * ```tsx
 * <PermissionGate permission="expedientes:create">
 *   <Button>Crear Expediente</Button>
 * </PermissionGate>
 *
 * <PermissionGate
 *   anyOf={["usuarios:create", "usuarios:update"]}
 *   fallback={<div>No tienes permisos</div>}
 * >
 *   <UserForm />
 * </PermissionGate>
 * ```
 */

import { ReactNode } from "react";
import { usePermissions } from "@features/auth/hooks/usePermissions";

interface PermissionGateProps {
  children: ReactNode;

  /** Permiso único requerido */
  permission?: string;

  /** Al menos uno de estos permisos (OR lógico) */
  anyOf?: string[];

  /** Todos estos permisos (AND lógico) */
  allOf?: string[];

  /** Requiere ser admin */
  requireAdmin?: boolean;

  /** Contenido alternativo si no tiene permisos */
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
