/**
 * ============================================
 * CONFIGURACIÓN DE NAVEGACIÓN CON RBAC
 * ============================================
 *
 * Estructura de menús para SIRES con soporte RBAC.
 * Los tipos NavMainItem y NavSecondaryItem serán importados
 * desde los componentes oficiales de sidebar-08 después de la instalación.
 */

import {
  LayoutDashboard,
  Stethoscope,
  FolderOpen,
  Shield,
  HelpCircle,
  Settings,
} from "lucide-react";

/**
 * Navegación principal (con submenús)
 */
export const navigationConfig = [
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
 * Navegación secundaria (soporte, configuración)
 */
export const secondaryNavConfig = [
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
