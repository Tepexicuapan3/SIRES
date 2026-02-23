import type { RouteObject } from "react-router-dom";

import DashboardPage from "@features/dashboard/pages/DashboardPage";

/**
 * Rutas core del sistema.
 *
 * Razon industria:
 * - Contiene entrypoints globales (dashboard) con dependencia minima.
 */
export const coreRoutes: RouteObject[] = [
  {
    path: "",
    element: <DashboardPage />,
  },
];
