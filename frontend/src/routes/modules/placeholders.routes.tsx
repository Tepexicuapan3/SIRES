import { lazy } from "react";
import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
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
const recepcionRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="pacientes" replace />,
  },
  {
    path: "pacientes",
    element: (
      <ProtectedRoute requiredPermission="recepcion:pacientes:create">
        <PlaceholderPage
          title="Gestion de Pacientes"
          description="Registro y administracion de pacientes"
          moduleName="Recepcion"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: "citas",
    element: (
      <ProtectedRoute requiredPermission="recepcion:citas:create">
        <PlaceholderPage
          title="Agenda de Citas"
          description="Programacion y gestion de citas medicas"
          moduleName="Recepcion"
        />
      </ProtectedRoute>
    ),
  },
];

const farmaciaRoutes: RouteObject[] = [
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

const urgenciasRoutes: RouteObject[] = [
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

export const RecepcionRoutes = () => useRoutes(recepcionRoutes);
export const FarmaciaRoutes = () => useRoutes(farmaciaRoutes);
export const UrgenciasRoutes = () => useRoutes(urgenciasRoutes);
