/**
 * nav-config.ts
 *
 * Configuración centralizada de navegación del sidebar.
 *
 * Filosofía:
 * - Define toda la estructura de menús en frontend
 * - Cada item tiene permisos requeridos para filtrarlo
 * - El hook useNavigation filtra según el usuario actual
 * - Backend valida SIEMPRE (esto es solo para UX)
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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  /** Texto mostrado en el menú */
  title: string;
  /** URL de navegación (React Router path) */
  url: string;
  /** Ícono de Lucide React */
  icon?: LucideIcon;
  /** Permisos requeridos (formato "resource:action"). Si está vacío, es público. */
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
 * Configuración completa de navegación.
 *
 * IMPORTANTE:
 * - Agregá aquí TODOS los menús que existan en el sistema
 * - El orden define cómo se ven en el sidebar
 * - Si un usuario no tiene permisos, la sección/item NO se muestra
 */
export const NAV_CONFIG: NavSection[] = [
  // ========================================================================
  // SECCIÓN: ADMINISTRACIÓN
  // ========================================================================
  {
    title: "Administración",
    roles: ["ROL_ADMINISTRADOR"], // Solo admins ven esta sección
    items: [
      {
        title: "Panel Admin",
        url: "/admin",
        icon: LayoutDashboard,
        permissions: ["admin:read"],
        items: [
          {
            title: "Dashboard",
            url: "/admin/dashboard",
            permissions: ["admin:read"],
          },
          {
            title: "Usuarios",
            url: "/admin/users",
            permissions: ["users:read"],
          },
          {
            title: "Roles y Permisos",
            url: "/admin/permissions",
            permissions: ["permissions:read"],
          },
        ],
      },
      {
        title: "Configuración",
        url: "/admin/settings",
        icon: Settings,
        permissions: ["settings:update"],
      },
    ],
  },

  // ========================================================================
  // SECCIÓN: MÉDICOS
  // ========================================================================
  {
    title: "Atención Médica",
    roles: ["ROL_MEDICO", "ROL_ENFERMERO"], // Médicos y enfermeros
    items: [
      {
        title: "Consultas",
        url: "/consultas",
        icon: Stethoscope,
        permissions: ["consultas:read"],
        items: [
          {
            title: "Nueva Consulta",
            url: "/consultas/nueva",
            permissions: ["consultas:create"],
          },
          {
            title: "Agenda",
            url: "/consultas/agenda",
            permissions: ["consultas:read"],
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
        icon: FileText,
        permissions: ["expedientes:read"],
        badge: "Nuevo",
      },
    ],
  },

  // ========================================================================
  // SECCIÓN: RECEPCIÓN / ADMISIÓN
  // ========================================================================
  {
    title: "Recepción",
    roles: ["ROL_RECEPCIONISTA", "ROL_ADMISION"],
    items: [
      {
        title: "Pacientes",
        url: "/pacientes",
        icon: Users,
        permissions: ["pacientes:read"],
        items: [
          {
            title: "Registrar Paciente",
            url: "/pacientes/nuevo",
            permissions: ["pacientes:create"],
          },
          {
            title: "Buscar Paciente",
            url: "/pacientes/buscar",
            permissions: ["pacientes:read"],
          },
        ],
      },
      {
        title: "Citas",
        url: "/citas",
        icon: Calendar,
        permissions: ["citas:read"],
      },
    ],
  },

  // ========================================================================
  // SECCIÓN: COMÚN (todos los roles autenticados)
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
