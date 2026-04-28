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
          {
            title: "Autorizadores",
            url: "/admin/catalogos/autorizadores",
            permissions: ["admin:catalogos:autorizadores:read"],
          },
          {
            title: "Bajas",
            url: "/admin/catalogos/bajas",
            permissions: ["admin:catalogos:bajas:read"],
          },
          {
            title: "Calidad laboral",
            url: "/admin/catalogos/calidad-laboral",
            permissions: ["admin:catalogos:calidad_laboral:read"],
          },
          {
            title: "Consultorios",
            url: "/admin/catalogos/consultorios",
            permissions: ["admin:catalogos:consultorios:read"],
          },
          {
            title: "Estado civil",
            url: "/admin/catalogos/edo-civil",
            permissions: ["admin:catalogos:edo_civil:read"],
          },
          {
            title: "Enfermedades",
            url: "/admin/catalogos/enfermedades",
            permissions: ["admin:catalogos:enfermedades:read"],
          },
          {
            title: "Escolaridad",
            url: "/admin/catalogos/escolaridad",
            permissions: ["admin:catalogos:escolaridad:read"],
          },
          {
            title: "Escuelas",
            url: "/admin/catalogos/escuelas",
            permissions: ["admin:catalogos:escuelas:read"],
          },
          {
            title: "Especialidades",
            url: "/admin/catalogos/especialidades",
            permissions: ["admin:catalogos:especialidades:read"],
          },
          {
            title: "Estudios medicos",
            url: "/admin/catalogos/estudios-medicos",
            permissions: ["admin:catalogos:estudios_med:read"],
          },
          {
            title: "Grupos de medicamentos",
            url: "/admin/catalogos/grupos-medicamentos",
            permissions: ["admin:catalogos:grupos_medicamentos:read"],
          },
          {
            title: "Ocupaciones",
            url: "/admin/catalogos/ocupaciones",
            permissions: ["admin:catalogos:ocupaciones:read"],
          },
          {
            title: "Origen de consulta",
            url: "/admin/catalogos/origen-consulta",
            permissions: ["admin:catalogos:origen_cons:read"],
          },
          {
            title: "Parentescos",
            url: "/admin/catalogos/parentescos",
            permissions: ["admin:catalogos:parentescos:read"],
          },
          {
            title: "Pases",
            url: "/admin/catalogos/pases",
            permissions: ["admin:catalogos:pases:read"],
          },
          {
            title: "Tipos de areas",
            url: "/admin/catalogos/tipos-areas",
            permissions: ["admin:catalogos:tipos_areas:read"],
          },
          {
            title: "Tipos de autorizacion",
            url: "/admin/catalogos/tipos-autorizacion",
            permissions: ["admin:catalogos:tp_autorizacion:read"],
          },
          {
            title: "Tipos de citas",
            url: "/admin/catalogos/tipos-citas",
            permissions: ["admin:catalogos:tipo_citas:read"],
          },
          {
            title: "Licencias",
            url: "/admin/catalogos/licencias",
            permissions: ["admin:catalogos:licencias:read"],
          },
          {
            title: "Tipos sanguineos",
            url: "/admin/catalogos/tipos-sanguineo",
            permissions: ["admin:catalogos:tipos_sanguineo:read"],
          },
          {
            title: "Turnos",
            url: "/admin/catalogos/turnos",
            permissions: ["admin:catalogos:turnos:read"],
          },
          {
            title: "Vacunas",
            url: "/admin/catalogos/vacunas",
            permissions: ["admin:catalogos:vacunas:read"],
          },
          {
            title: "Áreas clínicas",
            url: "/admin/catalogos/areas-clinicas",
            permissions: ["admin:catalogos:areas_clinicas:read"],
          },
          {
            title: "Áreas clínicas por centro",
            url: "/admin/catalogos/centro-area-clinica",
            permissions: ["admin:catalogos:centro_area_clinica:read"],
          },
          {
            title: "Catálogo CIES",
            url: "/admin/catalogos/cies",
            permissions: ["admin:catalogos:cies:upload"],
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
      },
    ],
  },
  {
    title: "Recepcion",
    items: [
      {
        title: "Citas y check-in",
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
        title: "Inventario de vacunas",
        url: "/farmacia/vacunas",
        icon: Pill,
        permissions: ["farmacia:vacunas:read"],
      },
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
