/**
 * ============================================
 * CONFIGURACIÓN DE NAVEGACIÓN CON RBAC
 * ============================================
 *
 * Estructura sidebar-08 con soporte para:
 * - Submenús colapsibles
 * - Navegación secundaria
 * - Filtrado dinámico por permisos
 *
 * NOTA: Los tipos NavMainItem y NavSecondaryItem se definirán
 * cuando instalemos sidebar-08 oficial.
 */

import {
  LayoutDashboard,
  Stethoscope,
  FolderOpen,
  Shield,
  HelpCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";

/**
 * TIPOS TEMPORALES (serán reemplazados por los oficiales de sidebar-08)
 */
export interface NavMainItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: string;
  items?: {
    title: string;
    url: string;
    permission?: string;
  }[];
}

export interface NavSecondaryItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: string;
}

/**
 * Navegación principal (con submenús)
 */
export const navigationConfig: NavMainItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    // Sin permiso = visible para todos autenticados
  },
  {
    title: "Consultas",
    url: "/consultas",
    icon: Stethoscope,
    permission: "consultas:read",
    items: [
      {
        title: "Nueva Consulta",
        url: "/consultas/nueva",
        permission: "consultas:create",
      },
      {
        title: "Historial",
        url: "/consultas/historial",
        permission: "consultas:read",
      },
    ],
  },
  {
    title: "Expedientes",
    url: "/expedientes",
    icon: FolderOpen,
    permission: "expedientes:read",
    items: [
      {
        title: "Buscar",
        url: "/expedientes/buscar",
        permission: "expedientes:read",
      },
      {
        title: "Crear Nuevo",
        url: "/expedientes/nuevo",
        permission: "expedientes:create",
      },
    ],
  },
  {
    title: "Administración",
    url: "/admin",
    icon: Shield,
    permission: "requireAdmin",
    items: [
      {
        title: "Panel Admin",
        url: "/admin",
        permission: "requireAdmin",
      },
      {
        title: "Usuarios",
        url: "/admin/usuarios",
        permission: "requireAdmin",
      },
      {
        title: "Nuevo Usuario",
        url: "/admin/usuarios/nuevo",
        permission: "usuarios:create",
      },
      {
        title: "Permisos",
        url: "/admin/permisos",
        permission: "requireAdmin",
      },
    ],
  },
];

/**
 * Navegación secundaria (mt-auto en sidebar)
 */
export const secondaryNavConfig: NavSecondaryItem[] = [
  {
    title: "Soporte",
    url: "/soporte",
    icon: HelpCircle,
    // Sin permiso = visible para todos
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings,
    // Sin permiso = visible para todos
  },
];
