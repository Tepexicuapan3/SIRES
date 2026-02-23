import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import UsersPage from "@features/admin/modules/rbac/users/pages/UsersPage";
import RolesPage from "@features/admin/modules/rbac/roles/pages/RolesPage";
import AreasPage from "@features/admin/modules/catalogos/areas/pages/AreasPage";
import CentrosAtencionPage from "@features/admin/modules/catalogos/centros-atencion/pages/CentrosAtencionPage";
import PlaceholderPage from "@/components/shared/PlaceholderPage";

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
  {
    path: "catalogos",
    children: [
      {
        index: true,
        element: <Navigate to="areas" replace />,
      },
      {
        path: "areas",
        element: (
          <ProtectedRoute requiredPermission="admin:catalogos:areas:read">
            <AreasPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "centros-atencion",
        element: (
          <ProtectedRoute requiredPermission="admin:catalogos:centros_atencion:read">
            <CentrosAtencionPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "expedientes",
    element: (
      <ProtectedRoute requiredPermission="admin:gestion:expedientes:read">
        <PlaceholderPage
          title="Expedientes"
          description="Configuracion y administracion de expedientes"
          moduleName="Administracion"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "reportes",
    element: (
      <ProtectedRoute requiredPermission="admin:reportes:read">
        <PlaceholderPage
          title="Reportes y Analitica Operativa"
          description="Indicadores operativos y reportes de gestion"
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
          description="Metricas globales y analisis historico"
          moduleName="Administracion"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "autorizacion/recetas",
    element: (
      <ProtectedRoute requiredPermission="admin:autorizacion:recetas:read">
        <PlaceholderPage
          title="Autorizacion de Recetas"
          description="Flujo de aprobacion y seguimiento de recetas"
          moduleName="Administracion"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "autorizacion/estudios",
    element: (
      <ProtectedRoute requiredPermission="admin:autorizacion:estudios:read">
        <PlaceholderPage
          title="Autorizacion de Estudios"
          description="Validacion y autorizacion de estudios clinicos"
          moduleName="Administracion"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "licencias",
    element: (
      <ProtectedRoute requiredPermission="admin:licencias:read">
        <PlaceholderPage
          title="Licencias"
          description="Gestion de licencias y control de accesos"
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
          description="Conciliacion operativa y financiera"
          moduleName="Administracion"
        />
      </ProtectedRoute>
    ),
  },
];
