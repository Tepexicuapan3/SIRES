import { lazy, Suspense } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@routes/guards/ProtectedRoute";

const AnunciosPage = lazy(
  () => import("@features/comunicados/modules/anuncios/pages/AnunciosPage"),
);

export const comunicadosRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="anuncios" replace />,
  },
  {
    path: "anuncios",
    element: (
      <ProtectedRoute requiredPermission="comunicados:anuncios:read">
        <Suspense fallback={<div className="p-6 text-sm text-txt-muted">Cargando...</div>}>
          <AnunciosPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];
