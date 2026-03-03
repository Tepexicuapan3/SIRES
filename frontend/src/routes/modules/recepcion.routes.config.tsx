import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import PlaceholderPage from "@/components/shared/PlaceholderPage";
import RecepcionAgendaPage from "@features/recepcion/modules/agenda/pages/RecepcionAgendaPage";
import { RECEPCION_QUEUE_READ_PERMISSIONS } from "@features/recepcion/shared/domain/recepcion.permissions";

const agendaElement = (
  <ProtectedRoute
    requiredAnyPermissions={[...RECEPCION_QUEUE_READ_PERMISSIONS]}
    dependencyAware
  >
    <RecepcionAgendaPage />
  </ProtectedRoute>
);

const recepcionCheckinRedirect = (
  <Navigate to="/recepcion/agenda?focus=checkin" replace />
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
    element: recepcionCheckinRedirect,
  },
  {
    path: "fichas",
    element: recepcionCheckinRedirect,
  },
  {
    path: "fichas/medicina-general",
    element: recepcionCheckinRedirect,
  },
  {
    path: "fichas/especialidad",
    element: recepcionCheckinRedirect,
  },
  {
    path: "fichas/urgencias",
    element: recepcionCheckinRedirect,
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
