import {
  Activity,
  Ambulance,
  BookOpen,
  ClipboardList,
  Database,
  FileText,
  FolderOpen,
  Key,
  LayoutDashboard,
  Pill,
  Shield,
  Stethoscope,
  ShieldUser,
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
export const PLACEHOLDER_BADGE = "Dev";

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
        title: "Panel",
        icon: ShieldUser,
        items: [
          {
            title: "Usuarios",
            url: "/admin/usuarios",
            permissions: ["admin:gestion:usuarios:read"],
          },
          {
            title: "Expedientes",
            url: "/admin/expedientes",
            permissions: ["admin:gestion:expedientes:read"],
            badge: PLACEHOLDER_BADGE,
          },
          {
            title: "Roles",
            url: "/admin/roles",
            permissions: ["admin:gestion:roles:read"],
          },
        ],
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
      {
        title: "Reportes",
        url: "/admin/reportes",
        icon: FileText,
        permissions: ["admin:reportes:read"],
        badge: PLACEHOLDER_BADGE,
      },
      {
        title: "Estadisticas",
        url: "/admin/estadisticas",
        icon: Activity,
        permissions: ["admin:estadisticas:read"],
        badge: PLACEHOLDER_BADGE,
      },
      {
        title: "Autorizacion",
        icon: Shield,
        items: [
          {
            title: "Recetas",
            url: "/admin/autorizacion/recetas",
            permissions: ["admin:autorizacion:recetas:read"],
            badge: PLACEHOLDER_BADGE,
          },
          {
            title: "Estudios",
            url: "/admin/autorizacion/estudios",
            permissions: ["admin:autorizacion:estudios:read"],
            badge: PLACEHOLDER_BADGE,
          },
        ],
      },
      {
        title: "Licencias",
        url: "/admin/licencias",
        icon: Key,
        permissions: ["admin:licencias:read"],
        badge: PLACEHOLDER_BADGE,
      },
      {
        title: "Conciliacion",
        url: "/admin/conciliacion",
        icon: Database,
        permissions: ["admin:conciliacion:read"],
        badge: PLACEHOLDER_BADGE,
      },
    ],
  },
  {
    title: "Clinico",
    items: [
      {
        title: "Consultas",
        icon: Stethoscope,
        items: [
          {
            title: "Listado",
            url: "/clinico/consultas",
            permissions: ["clinico:consultas:read"],
          },
          {
            title: "Agenda",
            url: "/clinico/consultas/agenda",
            permissions: ["clinico:consultas:agenda:read"],
          },
          {
            title: "Nueva Consulta",
            url: "/clinico/consultas/nueva",
            permissions: ["clinico:consultas:create"],
          },
          {
            title: "Historial",
            url: "/clinico/consultas/historial",
            permissions: ["clinico:consultas:historial:read"],
          },
        ],
      },
      {
        title: "Expedientes",
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
      {
        title: "Somatometria",
        url: "/clinico/somatometria",
        icon: Activity,
        permissions: ["clinico:somatometria:read"],
        badge: PLACEHOLDER_BADGE,
      },
    ],
  },
  {
    title: "Recepcion",
    items: [
      {
        title: "Fichas",
        icon: ClipboardList,
        items: [
          {
            title: "Medicina general",
            url: "/recepcion/fichas/medicina-general",
            permissions: ["recepcion:fichas:medicina_general:create"],
            badge: PLACEHOLDER_BADGE,
          },
          {
            title: "Especialidad",
            url: "/recepcion/fichas/especialidad",
            permissions: ["recepcion:fichas:especialidad:create"],
            badge: PLACEHOLDER_BADGE,
          },
          {
            title: "Urgencias",
            url: "/recepcion/fichas/urgencias",
            permissions: ["recepcion:fichas:urgencias:create"],
            badge: PLACEHOLDER_BADGE,
          },
        ],
      },
      {
        title: "Incapacidad",
        url: "/recepcion/incapacidad",
        icon: FileText,
        permissions: ["recepcion:incapacidad:create"],
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
