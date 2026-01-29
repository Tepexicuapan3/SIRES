import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import ConsultasPage from "@features/consultas/pages/ConsultasPage";
import AgendaPage from "@features/consultas/pages/AgendaPage";
import NuevaConsultaPage from "@features/consultas/pages/NuevaConsultaPage";
import HistorialPage from "@features/consultas/pages/HistorialPage";
import ExpedientesListPage from "@features/expedientes/pages/ExpedientesListPage";
import ExpedienteDetailPage from "@features/expedientes/pages/ExpedienteDetailPage";
import PlaceholderPage from "@/components/shared/PlaceholderPage";

// Clinico

const consultasRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <ProtectedRoute requiredPermission="clinico:consultas:read">
        <ConsultasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "agenda",
    element: (
      <ProtectedRoute requiredPermission="clinico:consultas:read">
        <AgendaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "nueva",
    element: (
      <ProtectedRoute requiredPermission="clinico:consultas:create">
        <NuevaConsultaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "historial",
    element: (
      <ProtectedRoute requiredPermission="clinico:consultas:read">
        <HistorialPage />
      </ProtectedRoute>
    ),
  },
];

const expedientesRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <ProtectedRoute requiredPermission="clinico:expedientes:read">
        <ExpedientesListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ":folio",
    element: (
      <ProtectedRoute requiredPermission="clinico:expedientes:read">
        <ExpedienteDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "nuevo",
    element: (
      <ProtectedRoute requiredPermission="clinico:expedientes:create">
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
export const clinicoRoutes: RouteObject[] = [
  {
    path: "consultas",
    children: consultasRoutes,
  },
  {
    path: "expedientes",
    children: expedientesRoutes,
  },
  {
    path: "somatometria",
    element: (
      <ProtectedRoute requiredPermission="clinico:somatometria:read">
        <PlaceholderPage
          title="Somatometria"
          description="Registro de medidas y evaluacion antropometrica"
          moduleName="Clinico"
        />
      </ProtectedRoute>
    ),
  },
  {
    index: true,
    element: <Navigate to="consultas" replace />,
  },
];
