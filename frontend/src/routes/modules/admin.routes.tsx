import { lazy } from "react";
import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

// Administracion
const UsersPage = lazy(() => import("@features/admin/pages/UsersPage"));
const CreateUserPage = lazy(
  () => import("@features/admin/pages/CreateUserPage"),
);
const RolesPage = lazy(() => import("@features/admin/pages/RolesPage"));
const CatalogosPage = lazy(() => import("@features/admin/pages/CatalogosPage"));

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
    path: "usuarios/nuevo",
    element: (
      <ProtectedRoute requiredPermission="admin:gestion:usuarios:create">
        <CreateUserPage />
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
  {
    path: "catalogos",
    element: (
      <ProtectedRoute requiredPermission="admin:catalogos:centros_atencion:read">
        <CatalogosPage />
      </ProtectedRoute>
    ),
  },
];

export const AdminRoutes = () => useRoutes(adminRoutes);
