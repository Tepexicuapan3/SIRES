import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { MainLayout } from "@/components/layouts/MainLayout";
import { SuspenseWrapper } from "@/components/shared/SuspenseWrapper";

// Lazy Imports
const LoginPage = lazy(() =>
  import("@features/auth/components/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const OnboardingPage = lazy(() =>
  import("@/features/auth/components/onboarding/OnboardingPage").then((m) => ({
    default: m.OnboardingPage,
  })),
);
const DashboardPage = lazy(
  () => import("@features/dashboard/components/DashboardPage"),
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
  // Ruta de Onboarding
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
    // Rutas del sistema
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
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
