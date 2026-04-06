import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import PlaceholderPage from "@/components/shared/PlaceholderPage";
import RecepcionAgendaPage from "@features/recepcion/modules/agenda/pages/RecepcionAgendaPage";
import RecepcionCheckinPage from "@features/recepcion/modules/checkin/pages/RecepcionCheckinPage";
import { RECEPCION_QUEUE_READ_PERMISSIONS } from "@features/recepcion/shared/domain/recepcion.permissions";
import RecepcionCitasPage from "@features/recepcion/modules/citas/pages/RecepcionCitasPage";

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
  path: "citas",
  element: <RecepcionCitasPage />,
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
