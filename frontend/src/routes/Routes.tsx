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

// ============================================================
// MÓDULO: ADMINISTRACIÓN
// ============================================================
const AdminPage = lazy(() => import("@features/admin/components/AdminPage"));
const CreateUserPage = lazy(
  () => import("@features/admin/components/CreateUserPage"),
);
const RolesPage = lazy(() =>
  import("@features/admin/components/roles").then((m) => ({
    default: m.RolesPage,
  })),
);
const CatalogosPage = lazy(
  () => import("@features/admin/components/CatalogosPage"),
);
const ConfigPage = lazy(() => import("@features/admin/components/ConfigPage"));
const AuditLogPage = lazy(
  () => import("@features/admin/components/AuditLogPage"),
);

// ============================================================
// MÓDULO: CONSULTAS MÉDICAS
// ============================================================
const ConsultasPage = lazy(
  () => import("@features/consultas/components/ConsultasPage"),
);
const AgendaPage = lazy(
  () => import("@features/consultas/components/AgendaPage"),
);
const NuevaConsultaPage = lazy(
  () => import("@features/consultas/components/NuevaConsultaPage"),
);
const HistorialPage = lazy(
  () => import("@features/consultas/components/HistorialPage"),
);

// ============================================================
// MÓDULO: EXPEDIENTES
// ============================================================
const ExpedientesListPage = lazy(
  () => import("@features/expedientes/components/ExpedientesListPage"),
);
const ExpedienteDetailPage = lazy(
  () => import("@features/expedientes/components/ExpedienteDetailPage"),
);

// ============================================================
// PLACEHOLDER: Componente genérico para páginas en desarrollo
// ============================================================
const PlaceholderPage = lazy(
  () => import("@/components/shared/PlaceholderPage"),
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

      // ========================================================
      // ADMINISTRACIÓN (8 rutas)
      // ========================================================
      {
        path: "/admin",
        element: (
          <ProtectedRoute requiredPermission="sistema:configurar">
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/usuarios",
        element: (
          <ProtectedRoute requiredPermission="usuarios:read">
            <UsersListPage />
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
      {
        path: "/admin/roles",
        element: (
          <ProtectedRoute requiredPermission="usuarios:assign_permissions">
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/permisos",
        element: (
          <ProtectedRoute requiredPermission="usuarios:assign_permissions">
            <PermissionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/catalogos",
        element: (
          <ProtectedRoute requiredPermission="catalogos:update">
            <CatalogosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/configuracion",
        element: (
          <ProtectedRoute requiredPermission="sistema:configurar">
            <ConfigPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/auditoria",
        element: (
          <ProtectedRoute requiredPermission="sistema:audit_logs">
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },

      // ========================================================
      // CONSULTAS MÉDICAS (4 rutas)
      // ========================================================
      {
        path: "/consultas",
        element: (
          <ProtectedRoute requiredPermission="consultas:read">
            <ConsultasPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/consultas/agenda",
        element: (
          <ProtectedRoute requiredPermission="consultas:read">
            <AgendaPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/consultas/nueva",
        element: (
          <ProtectedRoute requiredPermission="consultas:create">
            <NuevaConsultaPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/consultas/historial",
        element: (
          <ProtectedRoute requiredPermission="consultas:read">
            <HistorialPage />
          </ProtectedRoute>
        ),
      },

      // ========================================================
      // EXPEDIENTES (3 rutas)
      // ========================================================
      {
        path: "/expedientes",
        element: (
          <ProtectedRoute requiredPermission="expedientes:read">
            <ExpedientesListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/expedientes/:folio",
        element: (
          <ProtectedRoute requiredPermission="expedientes:read">
            <ExpedienteDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/expedientes/nuevo",
        element: (
          <ProtectedRoute requiredPermission="expedientes:create">
            <PlaceholderPage
              title="Nuevo Expediente"
              description="Formulario para crear un nuevo expediente médico"
              moduleName="Expedientes"
            />
          </ProtectedRoute>
        ),
      },

      // ========================================================
      // RECEPCIÓN (3 rutas placeholder)
      // ========================================================
      {
        path: "/recepcion",
        element: (
          <ProtectedRoute requiredPermission="recepcion:registrar_paciente">
            <PlaceholderPage
              title="Recepción"
              description="Panel principal de recepción de pacientes"
              moduleName="Recepción"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/recepcion/pacientes",
        element: (
          <ProtectedRoute requiredPermission="recepcion:registrar_paciente">
            <PlaceholderPage
              title="Gestión de Pacientes"
              description="Registro y administración de pacientes"
              moduleName="Recepción"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/recepcion/citas",
        element: (
          <ProtectedRoute requiredPermission="recepcion:agendar_cita">
            <PlaceholderPage
              title="Agenda de Citas"
              description="Programación y gestión de citas médicas"
              moduleName="Recepción"
            />
          </ProtectedRoute>
        ),
      },

      // ========================================================
      // URGENCIAS (2 rutas placeholder)
      // ========================================================
      {
        path: "/urgencias",
        element: (
          <ProtectedRoute requiredPermission="urgencias:atender">
            <PlaceholderPage
              title="Urgencias"
              description="Panel de atención de urgencias médicas"
              moduleName="Urgencias"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/urgencias/triage",
        element: (
          <ProtectedRoute requiredPermission="urgencias:triage">
            <PlaceholderPage
              title="Triage"
              description="Clasificación y priorización de pacientes"
              moduleName="Urgencias"
            />
          </ProtectedRoute>
        ),
      },

      // ========================================================
      // FARMACIA (4 rutas placeholder)
      // ========================================================
      {
        path: "/farmacia",
        element: (
          <ProtectedRoute requiredPermission="farmacia:dispensar">
            <PlaceholderPage
              title="Farmacia"
              description="Panel principal de farmacia"
              moduleName="Farmacia"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/farmacia/recetas",
        element: (
          <ProtectedRoute requiredPermission="farmacia:dispensar">
            <PlaceholderPage
              title="Gestión de Recetas"
              description="Dispensación y control de recetas médicas"
              moduleName="Farmacia"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/farmacia/inventario",
        element: (
          <ProtectedRoute requiredPermission="farmacia:gestionar_inventario">
            <PlaceholderPage
              title="Inventario"
              description="Control de stock y medicamentos"
              moduleName="Farmacia"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/farmacia/transcripcion",
        element: (
          <ProtectedRoute requiredPermission="farmacia:transcripcion">
            <PlaceholderPage
              title="Transcripción de Recetas"
              description="Transcripción y verificación de recetas"
              moduleName="Farmacia"
            />
          </ProtectedRoute>
        ),
      },

      // ========================================================
      // HOSPITAL (5 rutas placeholder)
      // ========================================================
      {
        path: "/hospital",
        element: (
          <ProtectedRoute requiredPermission="hospital:coordinacion">
            <PlaceholderPage
              title="Hospital"
              description="Panel de coordinación hospitalaria"
              moduleName="Hospital"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/hospital/admision",
        element: (
          <ProtectedRoute requiredPermission="hospital:admision">
            <PlaceholderPage
              title="Admisión Hospitalaria"
              description="Ingreso y egreso de pacientes"
              moduleName="Hospital"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/hospital/facturacion",
        element: (
          <ProtectedRoute requiredPermission="hospital:facturacion">
            <PlaceholderPage
              title="Facturación"
              description="Gestión de facturación hospitalaria"
              moduleName="Hospital"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/hospital/coordinacion",
        element: (
          <ProtectedRoute requiredPermission="hospital:coordinacion">
            <PlaceholderPage
              title="Coordinación"
              description="Coordinación de servicios hospitalarios"
              moduleName="Hospital"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/hospital/trabajo-social",
        element: (
          <ProtectedRoute requiredPermission="hospital:trabajo_social">
            <PlaceholderPage
              title="Trabajo Social"
              description="Atención y seguimiento social"
              moduleName="Hospital"
            />
          </ProtectedRoute>
        ),
      },

      // ========================================================
      // REPORTES (2 rutas placeholder)
      // ========================================================
      {
        path: "/reportes",
        element: (
          <ProtectedRoute requiredPermission="reportes:generar">
            <PlaceholderPage
              title="Reportes"
              description="Generación de reportes y estadísticas"
              moduleName="Reportes"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/reportes/estadisticas",
        element: (
          <ProtectedRoute requiredPermission="reportes:estadisticas">
            <PlaceholderPage
              title="Estadísticas"
              description="Análisis y métricas del sistema"
              moduleName="Reportes"
            />
          </ProtectedRoute>
        ),
      },

      // ========================================================
      // LABORATORIO (2 rutas placeholder)
      // ========================================================
      {
        path: "/laboratorio",
        element: (
          <ProtectedRoute requiredPermission="laboratorio:solicitar">
            <PlaceholderPage
              title="Laboratorio"
              description="Gestión de estudios de laboratorio"
              moduleName="Laboratorio"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: "/laboratorio/resultados",
        element: (
          <ProtectedRoute requiredPermission="laboratorio:resultados">
            <PlaceholderPage
              title="Resultados de Laboratorio"
              description="Consulta y registro de resultados"
              moduleName="Laboratorio"
            />
          </ProtectedRoute>
        ),
      },

      // ========================================================
      // LICENCIAS MÉDICAS (1 ruta placeholder)
      // ========================================================
      {
        path: "/licencias",
        element: (
          <ProtectedRoute requiredPermission="licencias:generar">
            <PlaceholderPage
              title="Licencias Médicas"
              description="Generación de licencias y certificados"
              moduleName="Licencias"
            />
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
