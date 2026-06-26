import { lazy, Suspense } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@routes/guards/ProtectedRoute";

const ContratosPage = lazy(
  () => import("@features/contratos-oxigeno/modules/gestion/pages/ContratosPage"),
);

export const serviciosRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="contratos-oxigeno" replace />,
  },
  {
    path: "contratos-oxigeno",
    element: (
      <ProtectedRoute requiredPermission="servicios:contratos_oxigeno:read">
        <Suspense fallback={<div className="p-6 text-sm text-txt-muted">Cargando...</div>}>
          <ContratosPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];
