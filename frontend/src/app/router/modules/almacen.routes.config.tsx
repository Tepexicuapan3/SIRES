import { Navigate, type RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@routes/guards/ProtectedRoute";

// Catálogos base
const InsumosPage        = lazy(() => import("@features/almacen-insumos/modules/catalogos/pages/InsumosPage"));
const CategoriasPage     = lazy(() => import("@features/almacen-insumos/modules/catalogos/pages/CategoriasPage"));
const ProveedoresPage    = lazy(() => import("@features/almacen-insumos/modules/catalogos/pages/ProveedoresPage"));
const UnidadesMedidaPage = lazy(() => import("@features/almacen-insumos/modules/catalogos/pages/UnidadesMedidaPage"));
const AlmacenesPage      = lazy(() => import("@features/almacen-insumos/modules/catalogos/pages/AlmacenesPage"));
// Kardex engine
const EntradasPage       = lazy(() => import("@features/almacen-insumos/modules/entradas/pages/EntradasPage"));
const KardexPage         = lazy(() => import("@features/almacen-insumos/modules/kardex/pages/KardexPage"));
const ExistenciasPage    = lazy(() => import("@features/almacen-insumos/modules/kardex/pages/ExistenciasPage"));
// Phase 3-6
const SalidasPage        = lazy(() => import("@features/almacen-insumos/modules/salidas/pages/SalidasPage"));
const ConsumosPage       = lazy(() => import("@features/almacen-insumos/modules/consumos/pages/ConsumosPage"));
const ConteosPage        = lazy(() => import("@features/almacen-insumos/modules/conteos/pages/ConteosPage"));
const DashboardAlmacenPage = lazy(() => import("@features/almacen-insumos/modules/dashboard/pages/DashboardAlmacenPage"));

const wrap = (Page: React.ComponentType) => (
  <ProtectedRoute requiredPermission="almacen:inventario:read">
    <Suspense fallback={<div>Cargando...</div>}>
      <Page />
    </Suspense>
  </ProtectedRoute>
);

export const almacenRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="dashboard" replace />,
  },
  // Dashboard
  { path: "dashboard",      element: wrap(DashboardAlmacenPage) },
  // Catálogos
  { path: "insumos",        element: wrap(InsumosPage) },
  { path: "categorias",     element: wrap(CategoriasPage) },
  { path: "proveedores",    element: wrap(ProveedoresPage) },
  { path: "unidades-medida", element: wrap(UnidadesMedidaPage) },
  { path: "almacenes",      element: wrap(AlmacenesPage) },
  // Kardex engine
  { path: "entradas",       element: wrap(EntradasPage) },
  { path: "salidas",        element: wrap(SalidasPage) },
  { path: "consumos",       element: wrap(ConsumosPage) },
  { path: "conteos",        element: wrap(ConteosPage) },
  { path: "kardex",         element: wrap(KardexPage) },
  { path: "existencias",    element: wrap(ExistenciasPage) },
];
