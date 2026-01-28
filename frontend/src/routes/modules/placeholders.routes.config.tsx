import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

// Placeholder: modulos no implementados
const PlaceholderPage = lazy(
  () => import("@/components/shared/PlaceholderPage"),
);

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
        <PlaceholderPage
          title="Fichas de medicina general"
          description="Registro y seguimiento de fichas de medicina general"
          moduleName="Recepcion"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "especialidad",
    element: (
      <ProtectedRoute requiredPermission="recepcion:fichas:especialidad:create">
        <PlaceholderPage
          title="Fichas de especialidad"
          description="Registro y seguimiento de fichas por especialidad"
          moduleName="Recepcion"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "urgencias",
    element: (
      <ProtectedRoute requiredPermission="recepcion:fichas:urgencias:create">
        <PlaceholderPage
          title="Fichas de urgencias"
          description="Registro y seguimiento de fichas de urgencias"
          moduleName="Recepcion"
        />
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
