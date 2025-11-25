import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ProtectedRoute } from "./ProtectedRoute";

// Lazy loading de páginas
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

// Wrapper para Suspense
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner size="xl" />}>{children}</Suspense>
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
    path: "/dashboard",
    element: (
      <SuspenseWrapper>
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </SuspenseWrapper>
    ),
  },
  {
    path: "/expedientes",
    element: (
      <SuspenseWrapper>
        <ProtectedRoute requiredRole="ROL">
          <ExpedientesPage />
        </ProtectedRoute>
      </SuspenseWrapper>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
