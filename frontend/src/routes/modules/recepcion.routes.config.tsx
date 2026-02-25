import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import PlaceholderPage from "@/components/shared/PlaceholderPage";
import RecepcionAgendaPage from "@features/recepcion/modules/agenda/pages/RecepcionAgendaPage";
import RecepcionCheckinPage from "@features/recepcion/modules/checkin/pages/RecepcionCheckinPage";
import {
  RECEPCION_QUEUE_READ_PERMISSIONS,
  RECEPCION_WRITE_PERMISSIONS,
} from "@features/recepcion/shared/domain/recepcion.permissions";

const agendaElement = (
  <ProtectedRoute
    requiredAnyPermissions={[...RECEPCION_QUEUE_READ_PERMISSIONS]}
    dependencyAware
  >
    <RecepcionAgendaPage />
  </ProtectedRoute>
);

const checkinElement = (
  <ProtectedRoute
    requiredAnyPermissions={[...RECEPCION_WRITE_PERMISSIONS]}
    dependencyAware
  >
    <RecepcionCheckinPage />
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
    path: "checkin",
    element: checkinElement,
  },
  {
    path: "fichas",
    element: <Navigate to="/recepcion/checkin" replace />,
  },
  {
    path: "fichas/medicina-general",
    element: checkinElement,
  },
  {
    path: "fichas/especialidad",
    element: checkinElement,
  },
  {
    path: "fichas/urgencias",
    element: checkinElement,
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
