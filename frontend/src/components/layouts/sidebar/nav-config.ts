import {
  LayoutDashboard,
  Users,
  Shield,
  BookOpen,
  Stethoscope,
  Calendar,
  FolderOpen,
  UserCheck,
  Ambulance,
  Pill,
  Database,
  type LucideIcon,
} from "lucide-react";

/**
 * Configuracion de navegacion basada en permisos.
 *
 * Razon industria:
 * - Mantiene el sidebar alineado a rutas reales.
 * - Usa permisos como filtro UX (backend siempre valida).
 */

export interface NavItem {
  title: string;
  url?: string;
  icon?: LucideIcon;
  permissions?: string[];
  items?: NavItem[];
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
  permissions?: string[];
}

// Badge reutilizable para modulos aun no implementados.
const PLACEHOLDER_BADGE = "En desarrollo";

export const NAV_CONFIG: NavSection[] = [
  {
    title: "Core",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Administracion",
    items: [
      {
        title: "Usuarios",
        url: "/admin/usuarios",
        icon: Users,
        permissions: ["admin:gestion:usuarios:read"],
      },
      {
        title: "Nuevo Usuario",
        url: "/admin/usuarios/nuevo",
        icon: Users,
        permissions: ["admin:gestion:usuarios:create"],
      },
      {
        title: "Roles",
        url: "/admin/roles",
        icon: Shield,
        permissions: ["admin:gestion:roles:read"],
      },
      {
        title: "Catalogos",
        url: "/admin/catalogos",
        icon: BookOpen,
        permissions: [
          "admin:catalogos:centros_atencion:read",
          "admin:catalogos:areas:read",
        ],
      },
    ],
  },
  {
    title: "Clinico",
    items: [
      {
        title: "Consultas",
        url: "/clinico/consultas",
        icon: Stethoscope,
        permissions: ["clinico:consultas:read"],
        items: [
          {
            title: "Listado",
            url: "/clinico/consultas",
            permissions: ["clinico:consultas:read"],
          },
          {
            title: "Agenda",
            url: "/clinico/consultas/agenda",
            permissions: ["clinico:consultas:read"],
          },
          {
            title: "Nueva Consulta",
            url: "/clinico/consultas/nueva",
            permissions: ["clinico:consultas:create"],
          },
          {
            title: "Historial",
            url: "/clinico/consultas/historial",
            permissions: ["clinico:consultas:read"],
          },
        ],
      },
      {
        title: "Expedientes",
        url: "/clinico/expedientes",
        icon: FolderOpen,
        permissions: ["clinico:expedientes:read"],
        items: [
          {
            title: "Listado",
            url: "/clinico/expedientes",
            permissions: ["clinico:expedientes:read"],
          },
          {
            title: "Nuevo Expediente",
            url: "/clinico/expedientes/nuevo",
            permissions: ["clinico:expedientes:create"],
            badge: PLACEHOLDER_BADGE,
          },
        ],
      },
    ],
  },
  {
    title: "Recepcion",
    items: [
      {
        title: "Pacientes",
        url: "/recepcion/pacientes",
        icon: UserCheck,
        permissions: ["recepcion:pacientes:create"],
        badge: PLACEHOLDER_BADGE,
      },
      {
        title: "Citas",
        url: "/recepcion/citas",
        icon: Calendar,
        permissions: ["recepcion:citas:create"],
        badge: PLACEHOLDER_BADGE,
      },
    ],
  },
  {
    title: "Farmacia",
    items: [
      {
        title: "Recetas",
        url: "/farmacia/recetas",
        icon: Pill,
        permissions: ["farmacia:recetas:dispensar"],
        badge: PLACEHOLDER_BADGE,
      },
      {
        title: "Inventario",
        url: "/farmacia/inventario",
        icon: Database,
        permissions: ["farmacia:inventario:update"],
        badge: PLACEHOLDER_BADGE,
      },
    ],
  },
  {
    title: "Urgencias",
    items: [
      {
        title: "Triage",
        url: "/urgencias/triage",
        icon: Ambulance,
        permissions: ["urgencias:triage:read"],
        badge: PLACEHOLDER_BADGE,
      },
    ],
  },
];

// Acciones globales disponibles para cualquier usuario autenticado.
export const NAV_SECONDARY: NavItem[] = [
  {
    title: "Soporte",
    url: "/soporte",
    icon: Shield,
  },
  {
    title: "Enviar Feedback",
    url: "/feedback",
    icon: BookOpen,
  },
];
