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

// Landing Pages por Rol
const AdminPage = lazy(() => import("@features/admin/components/AdminPage"));
const ConsultasPage = lazy(
  () => import("@features/consultas/components/ConsultasPage"),
);

// Páginas de Administración
const PermissionsPage = lazy(
  () => import("@features/admin/components/PermissionsPage"),
);
const CreateUserPage = lazy(
  () => import("@features/admin/components/CreateUserPage"),
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
      // Landing pages por rol
      {
        path: "/admin",
        element: (
          <ProtectedRoute requiredPermission="*">
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/consultas",
        element: (
          <ProtectedRoute requiredPermission="consultas:read">
            <ConsultasPage />
          </ProtectedRoute>
        ),
      },
      // Rutas de Administración
      {
        path: "/admin/permisos",
        element: (
          <ProtectedRoute requiredPermission="*">
            <PermissionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/usuarios/nuevo",
        element: (
          <ProtectedRoute requiredPermission="usuarios:create">
            <CreateUserPage />
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
