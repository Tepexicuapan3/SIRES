import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@routes/guards/ProtectedRoute";
import PlaceholderPage        from "@shared/components/PlaceholderPage";
import RecepcionAgendaPage    from "@features/recepcion/modules/agenda/pages/RecepcionAgendaPage";
import RecepcionCheckinPage   from "@features/recepcion/modules/checkin/pages/RecepcionCheckinPage";
import QrCheckinPage          from "@features/recepcion/modules/checkin/pages/QrCheckinPage";
import RecepcionFichasPage    from "@features/recepcion/modules/fichas/pages/RecepcionFichasPage";
import TurnosConfigPage       from "@features/recepcion/modules/turnos/pages/TurnosConfigPage";
import {
  RECEPCION_QUEUE_READ_PERMISSIONS,
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
    path: "checkin/qr",
    element: (
      <ProtectedRoute
        requiredAnyPermissions={[...RECEPCION_QUEUE_READ_PERMISSIONS]}
        dependencyAware
      >
        <QrCheckinPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "fichas",
    element: (
      <ProtectedRoute
        requiredAnyPermissions={[...RECEPCION_QUEUE_READ_PERMISSIONS]}
        dependencyAware
      >
        <RecepcionFichasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "turnos",
    element: <TurnosConfigPage />,
  },
  {
    path: "*",
    element: <Navigate to="/recepcion/agenda" replace />,
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
