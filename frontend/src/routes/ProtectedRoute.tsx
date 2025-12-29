import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@store/authStore";
import { ReactNode } from "react";
import { usePermissions } from "@features/auth/hooks/usePermissions";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string; // Opcional: requiere un rol específico (legacy)
  requiredPermission?: string; // RBAC 2.0: requiere un permiso específico
}

/**
 * Componente para proteger rutas que requieren autenticación
 * Y forzar el flujo de Onboarding (Términos y Cambio de Contraseña)
 *
 * RBAC 2.0: Ahora soporta `requiredPermission` además de `requiredRole`
 */
export const ProtectedRoute = ({
  children,
  requiredRole,
  requiredPermission,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // LÓGICA DE ONBOARDING
  // CASO A: El usuario DEBE aceptar términos, pero intenta navegar a otro lado
  if (user?.must_change_password && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // CASO B: El usuario YA cumplió, pero intenta volver a entrar a /onboarding
  if (!user?.must_change_password && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  // RBAC 2.0: Verificación de Permisos (prioridad sobre roles)
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

  // Verificación de Roles (legacy, mantener para compatibilidad)
  // Si requiere un rol específico y el usuario no lo tiene
  if (requiredRole && !user?.roles.includes(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-status-critical mb-4">
            Acceso Denegado
          </h1>
          <p className="text-txt-muted">
            No tienes permisos para acceder a esta página
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
