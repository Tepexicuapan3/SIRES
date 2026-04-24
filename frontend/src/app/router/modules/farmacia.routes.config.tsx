import { Navigate, type RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@routes/guards/ProtectedRoute";
import PlaceholderPage from "@shared/components/PlaceholderPage";

const InventarioVacunasPage = lazy(
  () => import("@features/farmacia/modules/vacunas/pages/InventarioVacunasPage"),
);

export const farmaciaRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="vacunas" replace />,
  },
  {
    path: "vacunas",
    element: (
      <ProtectedRoute
        requiredCapability="farmacia.vacunas.read"
        fallbackRequirement={{ allOf: ["farmacia:vacunas:read"] }}
        dependencyAware
      >
        <Suspense fallback={<div>Cargando...</div>}>
          <InventarioVacunasPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "recetas",
    element: (
      <ProtectedRoute requiredPermission="farmacia:recetas:dispensar">
        <PlaceholderPage
          title="Gestion de Recetas"
          description="Dispensacion y control de recetas medicas"
          moduleName="Farmacia"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "inventario",
    element: (
      <ProtectedRoute requiredPermission="farmacia:inventario:update">
        <PlaceholderPage
          title="Inventario"
          description="Control de stock y medicamentos"
          moduleName="Farmacia"
        />
      </ProtectedRoute>
    ),
  },
];
