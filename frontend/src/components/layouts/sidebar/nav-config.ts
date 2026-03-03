import {
  Activity,
  Ambulance,
  BookOpen,
  CalendarClock,
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
            badge: "New",
          },
        ],
      },
      {
        title: "Catalogos",
        icon: BookOpen,
        items: [
          {
            title: "Areas",
            url: "/admin/catalogos/areas",
            permissions: ["admin:catalogos:areas:read"],
          },
          {
            title: "Centros de atencion",
            url: "/admin/catalogos/centros-atencion",
            permissions: ["admin:catalogos:centros_atencion:read"],
          },
        ],
      },
      {
        title: "Reportes y Analitica Operativa",
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
            title: "Panel",
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
          {
            title: "Bandeja",
            url: "/clinico/consultas/doctor",
            permissions: ["clinico:consultas:read"],
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
        title: "Agenda + Check-in",
        url: "/recepcion/agenda",
        icon: CalendarClock,
        permissions: [
          "recepcion:fichas:medicina_general:create",
          "recepcion:fichas:especialidad:create",
          "recepcion:fichas:urgencias:create",
          "clinico:consultas:read",
          "clinico:somatometria:read",
        ],
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
