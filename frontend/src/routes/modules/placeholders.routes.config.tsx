import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import PlaceholderPage from "@/components/shared/PlaceholderPage";
import RecepcionQueuePage from "@features/flujo-clinico/pages/RecepcionQueuePage";

// Placeholder: modulos no implementados

/**
 * Rutas placeholder para modulos no implementados.
 *
 * Razon industria:
 * - Permite validar permisos y navegacion sin UI final.
 * - Evita rutas muertas mientras los modulos se desarrollan.
 */
const fichasRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="medicina-general" replace />,
  },
  {
    path: "medicina-general",
    element: (
      <ProtectedRoute requiredPermission="recepcion:fichas:medicina_general:create">
        <RecepcionQueuePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "especialidad",
    element: (
      <ProtectedRoute requiredPermission="recepcion:fichas:especialidad:create">
        <RecepcionQueuePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "urgencias",
    element: (
      <ProtectedRoute requiredPermission="recepcion:fichas:urgencias:create">
        <RecepcionQueuePage />
      </ProtectedRoute>
    ),
  },
];

export const recepcionRoutes: RouteObject[] = [
  {
    path: "fichas",
    children: fichasRoutes,
  },
  {
    path: "incapacidad",
    element: (
      <ProtectedRoute requiredPermission="recepcion:incapacidad:create">
        <PlaceholderPage
          title="Incapacidad"
          description="Gestion de incapacidades y formatos medicos"
          moduleName="Recepcion"
        />
      </ProtectedRoute>
    ),
  },
  {
    index: true,
    element: <Navigate to="fichas" replace />,
  },
];

export const farmaciaRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="recetas" replace />,
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

export const urgenciasRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="triage" replace />,
  },
  {
    path: "triage",
    element: (
      <ProtectedRoute requiredPermission="urgencias:triage:read">
        <PlaceholderPage
          title="Triage"
          description="Clasificacion y priorizacion de pacientes"
          moduleName="Urgencias"
        />
      </ProtectedRoute>
    ),
  },
];
