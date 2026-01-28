import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthSession } from "@features/auth/queries/useAuthSession";
import { usePermissions } from "@features/auth/queries/usePermissions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string; // RBAC: requiere un permiso específico
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
  requiredPermission,
}: ProtectedRouteProps) => {
  const { data: sessionUser, isLoading } = useAuthSession();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  // La sesion cacheada es la unica fuente de verdad.
  const isAuthenticated = Boolean(sessionUser);
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

  // LÓGICA DE ONBOARDING
  // CASO A: El usuario DEBE aceptar términos, pero intenta navegar a otro lado
  if (requiresOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // CASO B: El usuario YA cumplió, pero intenta volver a entrar a /onboarding
  if (!requiresOnboarding && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  // RBAC: Verificación de Permisos
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-status-critical mb-4">
            Acceso Denegado
          </h1>
          <p className="text-txt-muted">
            No tienes el permiso necesario:{" "}
            <code className="bg-bg-subtle px-2 py-1 rounded">
              {requiredPermission}
            </code>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
