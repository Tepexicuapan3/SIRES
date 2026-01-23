import { lazy } from "react";
import { useRoutes, type RouteObject } from "react-router-dom";

const DashboardPage = lazy(
  () => import("@features/dashboard/pages/DashboardPage"),
);

/**
 * Rutas core del sistema.
 *
 * Razon industria:
 * - Contiene entrypoints globales (dashboard) con dependencia minima.
 */
const coreRoutes: RouteObject[] = [
  {
    path: "",
    element: <DashboardPage />,
  },
];

export const CoreRoutes = () => useRoutes(coreRoutes);
