import { lazy } from "react";
import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

// Clinico
const ConsultasPage = lazy(
  () => import("@features/consultas/pages/ConsultasPage"),
);
const AgendaPage = lazy(() => import("@features/consultas/pages/AgendaPage"));
const NuevaConsultaPage = lazy(
  () => import("@features/consultas/pages/NuevaConsultaPage"),
);
const HistorialPage = lazy(
  () => import("@features/consultas/pages/HistorialPage"),
);
const ExpedientesListPage = lazy(
  () => import("@features/expedientes/pages/ExpedientesListPage"),
);
const ExpedienteDetailPage = lazy(
  () => import("@features/expedientes/pages/ExpedienteDetailPage"),
);
const PlaceholderPage = lazy(
  () => import("@/components/shared/PlaceholderPage"),
);

const consultasRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <ProtectedRoute requiredPermission="consultas:read">
        <ConsultasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "agenda",
    element: (
      <ProtectedRoute requiredPermission="consultas:read">
        <AgendaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "nueva",
    element: (
      <ProtectedRoute requiredPermission="consultas:create">
        <NuevaConsultaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "historial",
    element: (
      <ProtectedRoute requiredPermission="consultas:read">
        <HistorialPage />
      </ProtectedRoute>
    ),
  },
];

const expedientesRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <ProtectedRoute requiredPermission="expedientes:read">
        <ExpedientesListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ":folio",
    element: (
      <ProtectedRoute requiredPermission="expedientes:read">
        <ExpedienteDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "nuevo",
    element: (
      <ProtectedRoute requiredPermission="expedientes:create">
        <PlaceholderPage
          title="Nuevo Expediente"
          description="Formulario para crear un nuevo expediente medico"
          moduleName="Expedientes"
        />
      </ProtectedRoute>
    ),
  },
];

/**
 * Rutas del grupo Clinico (consultas + expedientes).
 *
 * Razon industria:
 * - Mantiene la jerarquia de dominio clinico en un solo modulo.
 * - Permite escalar submodulos sin fragmentar el router principal.
 */
const clinicoRoutes: RouteObject[] = [
  {
    path: "consultas",
    children: consultasRoutes,
  },
  {
    path: "expedientes",
    children: expedientesRoutes,
  },
  {
    index: true,
    element: <Navigate to="consultas" replace />,
  },
];

export const ClinicoRoutes = () => useRoutes(clinicoRoutes);
