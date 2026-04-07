import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthSession } from "@/domains/auth-access/hooks/useAuthSession";
import { useAuthCapabilities } from "@/domains/auth-access/hooks/useAuthCapabilities";
import { usePermissions } from "@/domains/auth-access/hooks/usePermissions";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { LoadingSpinner } from "@shared/components/LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredCapability?: string;
  requiredPermission?: string;
  requiredAllPermissions?: string[];
  requiredAnyPermissions?: string[];
  dependencyAware?: boolean;
}

/**
 * Guard de rutas para autenticacion y permisos.
 *
 * Razon industria:
 * - Centraliza el control de acceso para evitar duplicacion en UI.
 * - Aplica onboarding obligatorio antes de permitir navegacion general.
 * - Usa permisos como unica fuente de autorizacion.
 */
export const ProtectedRoute = ({
  children,
  requiredCapability,
  requiredPermission,
  requiredAllPermissions,
  requiredAnyPermissions,
  dependencyAware = false,
}: ProtectedRouteProps) => {
  const { data: sessionUser, isLoading } = useAuthSession();
  const isAuthenticated = Boolean(sessionUser);
  const shouldResolveCapabilities =
    Boolean(requiredCapability) && !isLoading && isAuthenticated;
  const {
    hasCapability: hasCapabilityFromProjection,
    isLoading: isCapabilitiesLoading,
    isError: isCapabilitiesError,
  } = useAuthCapabilities({ enabled: shouldResolveCapabilities });
  const { hasPermission, hasAllPermissions, hasAnyPermission } =
    usePermissions();
  const { hasEffectivePermission, hasEffectiveRequirement } =
    usePermissionDependencies();
  const location = useLocation();
  // La sesion cacheada es la unica fuente de verdad.
  const requiresOnboarding = Boolean(
    sessionUser?.requiresOnboarding ?? sessionUser?.mustChangePassword,
  );

  if (isLoading && !sessionUser) {
    return <LoadingSpinner fullScreen />;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredCapability && isCapabilitiesLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // LÓGICA DE ONBOARDING
  // CASO A: El usuario DEBE aceptar términos, pero intenta navegar a otro lado
  if (requiresOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // CASO B: El usuario YA cumplió, pero intenta volver a entrar a /onboarding
  if (!requiresOnboarding && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  const hasAccess = (() => {
    if (requiredCapability) {
      if (isCapabilitiesError) {
        return false;
      }

      return hasCapabilityFromProjection(requiredCapability);
    }

    if (requiredPermission) {
      return dependencyAware
        ? hasEffectivePermission(requiredPermission)
        : hasPermission(requiredPermission);
    }

    if (requiredAllPermissions?.length) {
      return dependencyAware
        ? hasEffectiveRequirement({ allOf: requiredAllPermissions })
        : hasAllPermissions(requiredAllPermissions);
    }

    if (requiredAnyPermissions?.length) {
      return dependencyAware
        ? hasEffectiveRequirement({ anyOf: requiredAnyPermissions })
        : hasAnyPermission(requiredAnyPermissions);
    }

    return true;
  })();

  // RBAC: Verificación de permisos
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-status-critical mb-4">
            Acceso Denegado
          </h1>
          <p className="text-txt-muted">
            No tienes permisos suficientes para acceder a esta seccion.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
