import { Navigate, type RouteObject } from "react-router-dom";
// farmaciaRoutes migrado a farmacia.routes.config.tsx
import { ProtectedRoute } from "@routes/guards/ProtectedRoute";
import PlaceholderPage from "@shared/components/PlaceholderPage";

// Placeholder: modulos no implementados

/**
 * Rutas placeholder para modulos no implementados.
 *
 * Razon industria:
 * - Permite validar permisos y navegacion sin UI final.
 * - Evita rutas muertas mientras los modulos se desarrollan.
 */
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
