/**
 * nav-config.ts
 *
 * Configuración centralizada de navegación del sidebar - RBAC 2.0
 *
 * Filosofía:
 * - Define toda la estructura de menús en frontend
 * - Cada item tiene permisos requeridos para filtrarlo
 * - El hook useNavigation filtra según el usuario actual
 * - Backend valida SIEMPRE (esto es solo para UX)
 *
 * IMPORTANTE:
 * - Roles SIN prefijo "ROL_" (ej: "ADMINISTRADOR", no "ROL_ADMINISTRADOR")
 * - Permisos en formato "categoria:accion" según BD (ej: "usuarios:create")
 * - 7 Áreas Funcionales que agrupan 22 roles del sistema
 */

import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  Stethoscope,
  Calendar,
  FileText,
  ClipboardList,
  UserPlus,
  BookOpen,
  Database,
  Activity,
  FolderOpen,
  UserCheck,
  Ambulance,
  Pill,
  Building2,
  BarChart3,
  FlaskConical,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  /** Texto mostrado en el menú */
  title: string;
  /** URL de navegación (React Router path) */
  url: string;
  /** Ícono de Lucide React */
  icon?: LucideIcon;
  /** Permisos requeridos (formato "categoria:accion"). Si está vacío, es público. */
  permissions?: string[];
  /** Items hijos (submenú) */
  items?: NavSubItem[];
  /** Badge opcional (ej: "Beta", "Nuevo") */
  badge?: string;
}

export interface NavSubItem {
  title: string;
  url: string;
  /** Permisos requeridos para este sub-item específico */
  permissions?: string[];
}

export interface NavSection {
  /** Título de la sección (ej: "ADMINISTRADOR", "MÉDICO") */
  title: string;
  /** Items de navegación de esta sección */
  items: NavItem[];
  /** Permisos necesarios para ver TODA la sección */
  permissions?: string[];
  /** Roles necesarios para ver TODA la sección (alternativa a permisos) */
  roles?: string[];
}

/**
 * Configuración completa de navegación - RBAC 2.0
 *
 * 7 ÁREAS FUNCIONALES:
 * 1. Administración (ADMINISTRADOR)
 * 2. Consultas (MEDICOS, ESPECIALISTAS, JEFATURA CLINICA, VISITADORES, LICENCIA Y SM21, HOSP-MEDICO)
 * 3. Recepción (RECEPCION, RECOEX, HOSP-RECEPCION, URGENCIAS RECEPCION H, URGENCIAS RECEPCION)
 * 4. Urgencias (URGENCIAS, URGENCIAS RECEPCION H)
 * 5. Farmacia (FARMACIA, TRANS-RECETA)
 * 6. Hospital (HOSP-FACTURA, HOSP-COORDINACION, HOSP-TRABAJO SOCIAL, HOSP-RECEPCION, HOSP-MEDICO)
 * 7. Reportes (GERENCIA, LABORAL)
 */
export const NAV_CONFIG: NavSection[] = [
  // ========================================================================
  // 1. ADMINISTRACIÓN
  // ========================================================================
  {
    title: "Administración",
    roles: ["ADMINISTRADOR"],
    items: [
      {
        title: "Panel Admin",
        url: "/admin",
        icon: Shield,
        permissions: ["sistema:configurar"],
        items: [
          {
            title: "Dashboard",
            url: "/admin",
            permissions: ["sistema:configurar"],
          },
          {
            title: "Usuarios",
            url: "/admin/usuarios",
            permissions: ["usuarios:read"],
          },
          {
            title: "Crear Usuario",
            url: "/admin/usuarios/nuevo",
            permissions: ["usuarios:create"],
          },
          {
            title: "Roles y Permisos",
            url: "/admin/roles",
            permissions: ["usuarios:assign_permissions"],
          },
          {
            title: "Permisos Detalle",
            url: "/admin/permisos",
            permissions: ["usuarios:assign_permissions"],
          },
        ],
      },
      {
        title: "Catálogos",
        url: "/admin/catalogos",
        icon: BookOpen,
        permissions: ["catalogos:update"],
      },
      {
        title: "Configuración",
        url: "/admin/configuracion",
        icon: Settings,
        permissions: ["sistema:configurar"],
      },
      {
        title: "Logs de Auditoría",
        url: "/admin/auditoria",
        icon: Activity,
        permissions: ["sistema:audit_logs"],
      },
    ],
  },

  // ========================================================================
  // 2. CONSULTAS (6 roles: MEDICOS, ESPECIALISTAS, JEFATURA CLINICA, etc.)
  // ========================================================================
  {
    title: "Consultas Médicas",
    roles: [
      "MEDICOS",
      "ESPECIALISTAS",
      "JEFATURA CLINICA",
      "VISITADORES",
      "LICENCIA Y SM21",
      "HOSP-MEDICO",
    ],
    items: [
      {
        title: "Consultas",
        url: "/consultas",
        icon: Stethoscope,
        permissions: ["consultas:read"],
        items: [
          {
            title: "Panel Principal",
            url: "/consultas",
            permissions: ["consultas:read"],
          },
          {
            title: "Agenda",
            url: "/consultas/agenda",
            permissions: ["consultas:read"],
          },
          {
            title: "Nueva Consulta",
            url: "/consultas/nueva",
            permissions: ["consultas:create"],
          },
          {
            title: "Historial",
            url: "/consultas/historial",
            permissions: ["consultas:read"],
          },
        ],
      },
      {
        title: "Expedientes",
        url: "/expedientes",
        icon: FolderOpen,
        permissions: ["expedientes:read"],
        items: [
          {
            title: "Buscar Expediente",
            url: "/expedientes",
            permissions: ["expedientes:read"],
          },
          {
            title: "Nuevo Expediente",
            url: "/expedientes/nuevo",
            permissions: ["expedientes:create"],
          },
        ],
      },
      {
        title: "Recetas",
        url: "/recetas",
        icon: Pill,
        permissions: ["consultas:prescribir"],
      },
      {
        title: "Laboratorio",
        url: "/laboratorio",
        icon: FlaskConical,
        permissions: ["laboratorio:solicitar"],
      },
      {
        title: "Licencias",
        url: "/licencias",
        icon: ClipboardCheck,
        permissions: ["licencias:emitir"],
      },
      {
        title: "Pases Médicos",
        url: "/pases",
        icon: FileText,
        permissions: ["pases:emitir"],
      },
    ],
  },

  // ========================================================================
  // 3. RECEPCIÓN (5 roles)
  // ========================================================================
  {
    title: "Recepción",
    roles: [
      "RECEPCION",
      "RECOEX",
      "HOSP-RECEPCION",
      "URGENCIAS RECEPCION H",
      "URGENCIAS RECEPCION",
    ],
    items: [
      {
        title: "Panel Recepción",
        url: "/recepcion",
        icon: UserCheck,
        permissions: ["expedientes:read"],
      },
      {
        title: "Pacientes",
        url: "/recepcion/pacientes",
        icon: Users,
        permissions: ["expedientes:read"],
        items: [
          {
            title: "Registrar Paciente",
            url: "/recepcion/pacientes/nuevo",
            permissions: ["expedientes:create"],
          },
          {
            title: "Buscar Paciente",
            url: "/recepcion/pacientes/buscar",
            permissions: ["expedientes:read"],
          },
        ],
      },
      {
        title: "Citas",
        url: "/recepcion/citas",
        icon: Calendar,
        permissions: ["citas:create"],
      },
      {
        title: "Expedientes",
        url: "/expedientes",
        icon: FolderOpen,
        permissions: ["expedientes:read"],
      },
    ],
  },

  // ========================================================================
  // 4. URGENCIAS (2 roles)
  // ========================================================================
  {
    title: "Urgencias",
    roles: ["URGENCIAS", "URGENCIAS RECEPCION H"],
    items: [
      {
        title: "Panel Urgencias",
        url: "/urgencias",
        icon: Ambulance,
        permissions: ["urgencias:atender"],
      },
      {
        title: "Triage",
        url: "/urgencias/triage",
        icon: Activity,
        permissions: ["urgencias:triage"],
      },
      {
        title: "Atenciones",
        url: "/urgencias/atenciones",
        icon: Stethoscope,
        permissions: ["urgencias:atender"],
      },
      {
        title: "Expedientes",
        url: "/expedientes",
        icon: FolderOpen,
        permissions: ["expedientes:read"],
      },
    ],
  },

  // ========================================================================
  // 5. FARMACIA (2 roles)
  // ========================================================================
  {
    title: "Farmacia",
    roles: ["FARMACIA", "TRANS-RECETA"],
    items: [
      {
        title: "Panel Farmacia",
        url: "/farmacia",
        icon: Pill,
        permissions: ["farmacia:dispensar"],
      },
      {
        title: "Recetas Pendientes",
        url: "/farmacia/recetas",
        icon: ClipboardList,
        permissions: ["farmacia:dispensar"],
      },
      {
        title: "Inventario",
        url: "/farmacia/inventario",
        icon: Database,
        permissions: ["farmacia:gestionar_inventario"],
      },
      {
        title: "Transcripción Recetas",
        url: "/farmacia/transcripcion",
        icon: FileText,
        permissions: ["farmacia:transcribir_recetas"],
      },
    ],
  },

  // ========================================================================
  // 6. HOSPITAL (5 roles)
  // ========================================================================
  {
    title: "Hospital",
    roles: [
      "HOSP-FACTURA",
      "HOSP-COORDINACION",
      "HOSP-TRABAJO SOCIAL",
      "HOSP-RECEPCION",
      "HOSP-MEDICO",
    ],
    items: [
      {
        title: "Panel Hospital",
        url: "/hospital",
        icon: Building2,
        permissions: ["hospital:gestionar"],
      },
      {
        title: "Admisión",
        url: "/hospital/admision",
        icon: UserPlus,
        permissions: ["hospital:admitir"],
      },
      {
        title: "Facturación",
        url: "/hospital/facturacion",
        icon: FileText,
        permissions: ["hospital:facturar"],
      },
      {
        title: "Coordinación",
        url: "/hospital/coordinacion",
        icon: Settings,
        permissions: ["hospital:coordinar"],
      },
      {
        title: "Trabajo Social",
        url: "/hospital/trabajo-social",
        icon: Users,
        permissions: ["hospital:trabajo_social"],
      },
    ],
  },

  // ========================================================================
  // 7. REPORTES (2 roles: GERENCIA, LABORAL)
  // ========================================================================
  {
    title: "Reportes y Estadísticas",
    roles: ["GERENCIA", "LABORAL"],
    items: [
      {
        title: "Dashboard Gerencial",
        url: "/reportes",
        icon: BarChart3,
        permissions: ["reportes:gerenciales"],
      },
      {
        title: "Estadísticas Clínicas",
        url: "/reportes/clinicas",
        icon: Activity,
        permissions: ["reportes:clinicos"],
      },
      {
        title: "Reportes Personalizados",
        url: "/reportes/personalizados",
        icon: FileText,
        permissions: ["reportes:generar"],
      },
    ],
  },

  // ========================================================================
  // COMÚN (todos los roles autenticados)
  // ========================================================================
  {
    title: "General",
    // Sin roles/permissions = todos ven esto (pero deben estar autenticados)
    items: [
      {
        title: "Mi Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
];

/**
 * Items de navegación secundaria (Support / Feedback / Ayuda)
 * Estos van ARRIBA del NavUser en el footer del sidebar.
 */
export const NAV_SECONDARY: NavItem[] = [
  {
    title: "Soporte",
    url: "/soporte",
    icon: Shield,
  },
  {
    title: "Enviar Feedback",
    url: "/feedback",
    icon: ClipboardList,
  },
];
