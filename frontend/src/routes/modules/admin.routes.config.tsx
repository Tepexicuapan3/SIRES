import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import UsersPage from "@features/admin/modules/rbac/users/pages/UsersPage";
import RolesPage from "@features/admin/modules/rbac/roles/pages/RolesPage";

// Administracion

/**
 * Rutas del grupo Administracion.
 *
 * Razon industria:
 * - Agrupa la configuracion de usuarios/roles en un solo modulo.
 * - Facilita ownership y lazy loading por dominio.
 */
export const adminRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="usuarios" replace />, // entrypoint por defecto
  },
  {
    path: "usuarios",
    element: (
      <ProtectedRoute requiredPermission="admin:gestion:usuarios:read">
        <UsersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "roles",
    element: (
      <ProtectedRoute requiredPermission="admin:gestion:roles:read">
        <RolesPage />
      </ProtectedRoute>
    ),
  },
];
