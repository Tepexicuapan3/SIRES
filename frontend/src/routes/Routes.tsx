import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { MainLayout } from "@/components/layouts/MainLayout";
import { RootLayout } from "@/components/layouts/RootLayout";
import { SuspenseWrapper } from "@/components/shared/SuspenseWrapper";

// Core auth
const LoginPage = lazy(() =>
  import("@features/auth/pages/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const OnboardingPage = lazy(() =>
  import("@/features/auth/pages/OnboardingPage").then((m) => ({
    default: m.OnboardingPage,
  })),
);

/**
 * Modulos lazy por grupo.
 *
 * Razon industria:
 * - Centraliza la carga de modulos para evitar duplicacion en UI.
 * - Los modulos se cargan en lazy para reducir el bundle inicial.
 */
const CoreRoutes = lazy(() =>
  import("@/routes/modules/core.routes").then((m) => ({
    default: m.CoreRoutes,
  })),
);
const AdminRoutes = lazy(() =>
  import("@/routes/modules/admin.routes").then((m) => ({
    default: m.AdminRoutes,
  })),
);
const ClinicoRoutes = lazy(() =>
  import("@/routes/modules/clinico.routes").then((m) => ({
    default: m.ClinicoRoutes,
  })),
);
const RecepcionRoutes = lazy(() =>
  import("@/routes/modules/placeholders.routes").then((m) => ({
    default: m.RecepcionRoutes,
  })),
);
const FarmaciaRoutes = lazy(() =>
  import("@/routes/modules/placeholders.routes").then((m) => ({
    default: m.FarmaciaRoutes,
  })),
);
const UrgenciasRoutes = lazy(() =>
  import("@/routes/modules/placeholders.routes").then((m) => ({
    default: m.UrgenciasRoutes,
  })),
);

/**
 * Router principal.
 *
 * Razon industria:
 * - Centraliza el arbol de rutas y mantiene el entrypoint liviano.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "/login",
        element: (
          <SuspenseWrapper>
            <LoginPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/onboarding",
        element: (
          <ProtectedRoute>
            <SuspenseWrapper>
              <OnboardingPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        element: (
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        ),
        children: [
          // Grupos de rutas por dominio
          {
            path: "/dashboard",
            element: (
              <SuspenseWrapper>
                <CoreRoutes />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/admin/*",
            element: (
              <SuspenseWrapper>
                <AdminRoutes />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/clinico/*",
            element: (
              <SuspenseWrapper>
                <ClinicoRoutes />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/recepcion/*",
            element: (
              <SuspenseWrapper>
                <RecepcionRoutes />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/farmacia/*",
            element: (
              <SuspenseWrapper>
                <FarmaciaRoutes />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/urgencias/*",
            element: (
              <SuspenseWrapper>
                <UrgenciasRoutes />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
