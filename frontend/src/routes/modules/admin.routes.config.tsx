import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

// Administracion
const AdminPage = lazy(() => import("@features/admin/pages/AdminPage"));
const UsersPage = lazy(() => import("@features/admin/pages/UsersPage"));
const CreateUserPage = lazy(
  () => import("@features/admin/pages/CreateUserPage"),
);
const RolesPage = lazy(() => import("@features/admin/pages/RolesPage"));
const CatalogosPage = lazy(() => import("@features/admin/pages/CatalogosPage"));
const PlaceholderPage = lazy(
  () => import("@/components/shared/PlaceholderPage"),
);

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
    element: <Navigate to="panel" replace />, // entrypoint por defecto
  },
  {
    path: "panel",
    element: (
      <ProtectedRoute requiredPermission="admin:panel:read">
        <AdminPage />
      </ProtectedRoute>
    ),
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
    path: "expedientes-derechohabientes",
    element: (
      <ProtectedRoute requiredPermission="admin:gestion:expedientes_derechohabientes:read">
        <PlaceholderPage
          title="Expedientes de derechohabientes"
          description="Gestion de expedientes administrativos de derechohabientes"
          moduleName="Administracion"
        />
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
  {
    path: "reportes",
    element: (
      <ProtectedRoute requiredPermission="admin:reportes:read">
        <PlaceholderPage
          title="Reportes"
          description="Reportes operativos y ejecutivos del sistema"
          moduleName="Administracion"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "estadisticas",
    element: (
      <ProtectedRoute requiredPermission="admin:estadisticas:read">
        <PlaceholderPage
          title="Estadisticas"
          description="Panel de estadisticas y analitica administrativa"
          moduleName="Administracion"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "autorizacion",
    children: [
      {
        index: true,
        element: <Navigate to="recetas" replace />,
      },
      {
        path: "recetas",
        element: (
          <ProtectedRoute requiredPermission="admin:autorizacion:recetas:read">
            <PlaceholderPage
              title="Autorizacion de recetas"
              description="Control y autorizacion de recetas"
              moduleName="Autorizacion"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "estudios",
        element: (
          <ProtectedRoute requiredPermission="admin:autorizacion:estudios:read">
            <PlaceholderPage
              title="Autorizacion de estudios"
              description="Control y autorizacion de estudios"
              moduleName="Autorizacion"
            />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "licencias",
    element: (
      <ProtectedRoute requiredPermission="admin:licencias:read">
        <PlaceholderPage
          title="Licencias"
          description="Administracion de licencias y permisos"
          moduleName="Administracion"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "conciliacion",
    element: (
      <ProtectedRoute requiredPermission="admin:conciliacion:read">
        <PlaceholderPage
          title="Conciliacion"
          description="Conciliacion de registros y procesos internos"
          moduleName="Administracion"
        />
      </ProtectedRoute>
    ),
  },
];
