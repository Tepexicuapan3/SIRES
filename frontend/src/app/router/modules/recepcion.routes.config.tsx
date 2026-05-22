import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@routes/guards/ProtectedRoute";
import PlaceholderPage from "@shared/components/PlaceholderPage";
import RecepcionAgendaPage    from "@features/recepcion/modules/agenda/pages/RecepcionAgendaPage";
import RecepcionCheckinPage   from "@features/recepcion/modules/checkin/pages/RecepcionCheckinPage";
import TurnosConfigPage       from "@features/recepcion/modules/turnos/pages/TurnosConfigPage";
import AgendaSemanalPage  from "@features/recepcion/modules/citas/pages/AgendaSemanalPage";
import {
  RECEPCION_QUEUE_READ_PERMISSIONS,
  CITAS_READ_PERMISSION,
  CITAS_WRITE_PERMISSION,
} from "@features/recepcion/shared/domain/recepcion.permissions";

const agendaElement = (
  <ProtectedRoute
    requiredAnyPermissions={[...RECEPCION_QUEUE_READ_PERMISSIONS]}
    dependencyAware
  >
    <RecepcionAgendaPage />
  </ProtectedRoute>
);

export const recepcionRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="agenda" replace />,
  },
  {
    path: "agenda",
    element: agendaElement,
  },
  {
    path: "agendar-cita",
    element: <RecepcionCheckinPage />,
  },
  {
    path: "checkin",
    element: <RecepcionCheckinPage />,
  },
  {
    path: "fichas/*",
    element: <RecepcionCheckinPage />,
  },
  {
    path: "turnos",
    element: <TurnosConfigPage />,
  },
  {
    path: "citas",
    element: <Navigate to="/recepcion/agenda" replace />,
  },
  {
    path: "agenda-semanal",
    element: (
      <ProtectedRoute
        requiredAnyPermissions={[CITAS_READ_PERMISSION, CITAS_WRITE_PERMISSION]}
        dependencyAware
      >
        <AgendaSemanalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "incapacidad",
    element: (
      <ProtectedRoute
        requiredPermission="recepcion:incapacidad:create"
        dependencyAware
      >
        <PlaceholderPage
          title="Incapacidad"
          description="Gestion de incapacidades y formatos medicos"
          moduleName="Recepcion"
        />
      </ProtectedRoute>
    ),
  },
];
