import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { MainLayout } from "@/components/layouts/MainLayout";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

// Lazy Loading de Páginas
const LoginPage = lazy(() =>
  import("@features/auth/components/LoginPage").then((m) => ({
    default: m.LoginPage,
  }))
);
const DashboardPage = lazy(
  () => import("@features/dashboard/components/DashboardPage")
);
const ExpedientesPage = lazy(
  () => import("@features/expedientes/components/ExpedientesPage")
);

// Wrapper Helper
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={<LoadingSpinner fullScreen={true} text="Cargando sistema..." />}
  >
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
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
    // Rutas Protegidas (Dashboard, App interna)
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/expedientes",
        element: (
          <ProtectedRoute requiredRole="ROL_MEDICO">
            <ExpedientesPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
