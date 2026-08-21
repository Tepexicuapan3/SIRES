import {
  Activity,
  AlertTriangle,
  Ambulance,
  Archive,
  BarChart3,
  BedDouble,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Circle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  CreditCard,
  Database,
  FileText,
  FlaskConical,
  FolderOpen,
  Gauge,
  GraduationCap,
  HeartPulse,
  Home,
  Hospital,
  Key,
  LayoutDashboard,
  Lock,
  MapPin,
  MessageSquare,
  Microscope,
  Package,
  Phone,
  Pill,
  Printer,
  Receipt,
  ScrollText,
  Search,
  Settings,
  Shield,
  ShieldUser,
  Stethoscope,
  Syringe,
  Truck,
  User,
  UserCheck,
  UserPlus,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

/**
 * Mapa explicito string(kebab-case) -> componente LucideIcon.
 *
 * Razon industria:
 * - `cat_modulos.icono` (BD) guarda el nombre del icono como string plano
 *   para no acoplar el catalogo administrable a React/Lucide.
 * - Este mapa es la UNICA fuente de resolucion string -> componente del
 *   frontend; el seed (`navigation_seed.py`) transcribe estas mismas
 *   claves desde `nav-config.ts`, ambos deben mantenerse en sync.
 * - `NavIconPicker` (Fase 6, `features/admin/modules/menus/components/`)
 *   es la UNICA superficie donde un admin elige un icono -- SIEMPRE por
 *   grid visual, nunca tipeando el nombre kebab-case a mano. El test
 *   anti-drift (`nav-icons.test.ts`) exige que las opciones del picker
 *   sean EXACTAMENTE `Object.keys(NAV_ICONS)`, ni mas ni menos.
 *
 * IMPORTANTE: nunca usar `import * as lucide from "lucide-react"` -- rompe
 * el tree-shaking e infla el bundle con los ~1000+ iconos de la libreria.
 * Agregar aqui SOLO iconos curados (relevantes para un sistema clinico/
 * administrativo), nunca el catalogo completo de Lucide.
 */
export const NAV_ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  "alert-triangle": AlertTriangle,
  ambulance: Ambulance,
  archive: Archive,
  "bar-chart": BarChart3,
  bed: BedDouble,
  bell: Bell,
  "book-open": BookOpen,
  briefcase: Briefcase,
  building: Building2,
  calendar: Calendar,
  "calendar-check": CalendarCheck,
  "calendar-clock": CalendarClock,
  "clipboard-check": ClipboardCheck,
  "clipboard-list": ClipboardList,
  clock: Clock,
  "credit-card": CreditCard,
  database: Database,
  "file-text": FileText,
  "flask-conical": FlaskConical,
  "folder-open": FolderOpen,
  gauge: Gauge,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  home: Home,
  hospital: Hospital,
  key: Key,
  "layout-dashboard": LayoutDashboard,
  lock: Lock,
  "map-pin": MapPin,
  "message-square": MessageSquare,
  microscope: Microscope,
  package: Package,
  phone: Phone,
  pill: Pill,
  printer: Printer,
  receipt: Receipt,
  "scroll-text": ScrollText,
  search: Search,
  settings: Settings,
  shield: Shield,
  "shield-user": ShieldUser,
  stethoscope: Stethoscope,
  syringe: Syringe,
  truck: Truck,
  user: User,
  "user-check": UserCheck,
  "user-plus": UserPlus,
  users: Users,
  warehouse: Warehouse,
};

/**
 * Nombre humano de cada icono de `NAV_ICONS`, en español, para mostrar en
 * `NavIconPicker` (tooltip/label de cada celda del grid). Mismo invariante
 * que `MENU_DESTINATION_LABELS`: TODA clave de `NAV_ICONS` debe tener su
 * label acá -- el test anti-drift lo exige 1:1.
 */
export const NAV_ICON_LABELS: Record<string, string> = {
  activity: "Actividad",
  "alert-triangle": "Alerta",
  ambulance: "Ambulancia",
  archive: "Archivo",
  "bar-chart": "Gráfico de barras",
  bed: "Cama",
  bell: "Notificación",
  "book-open": "Libro abierto",
  briefcase: "Maletín",
  building: "Edificio",
  calendar: "Calendario",
  "calendar-check": "Calendario confirmado",
  "calendar-clock": "Calendario con reloj",
  "clipboard-check": "Lista verificada",
  "clipboard-list": "Lista de tareas",
  clock: "Reloj",
  "credit-card": "Tarjeta",
  database: "Base de datos",
  "file-text": "Documento",
  "flask-conical": "Matraz",
  "folder-open": "Carpeta abierta",
  gauge: "Indicador",
  "graduation-cap": "Birrete",
  "heart-pulse": "Pulso cardíaco",
  home: "Inicio",
  hospital: "Hospital",
  key: "Llave",
  "layout-dashboard": "Panel",
  lock: "Candado",
  "map-pin": "Ubicación",
  "message-square": "Mensaje",
  microscope: "Microscopio",
  package: "Paquete",
  phone: "Teléfono",
  pill: "Medicamento",
  printer: "Impresora",
  receipt: "Recibo",
  "scroll-text": "Pergamino",
  search: "Buscar",
  settings: "Configuración",
  shield: "Escudo",
  "shield-user": "Escudo de usuario",
  stethoscope: "Estetoscopio",
  syringe: "Jeringa",
  truck: "Camión",
  user: "Usuario",
  "user-check": "Usuario verificado",
  "user-plus": "Agregar usuario",
  users: "Usuarios",
  warehouse: "Almacén",
};

/** Opcion de icono derivada -- nombre kebab-case + label humano. */
export interface NavIconOption {
  name: string;
  label: string;
}

/**
 * Deriva las opciones que ofrece `NavIconPicker` directamente de
 * `NAV_ICONS`/`NAV_ICON_LABELS` -- vive acá (no en el componente) porque
 * exportar una funcion no-componente desde un archivo de componente rompe
 * `react-refresh/only-export-components`. El test anti-drift
 * (`nav-icons.test.ts`, Fase 6.3) importa esta funcion para verificar, sin
 * renderizar Radix/Popover en jsdom, que el conjunto de opciones del picker
 * es EXACTAMENTE `Object.keys(NAV_ICONS)` -- ni un icono de mas, ni uno de
 * menos.
 */
export const buildNavIconOptions = (): NavIconOption[] =>
  Object.keys(NAV_ICONS)
    .map((name) => ({ name, label: NAV_ICON_LABELS[name] ?? name }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));

/** Icono usado cuando el nombre no llega o no matchea ninguna clave del mapa. */
export const DEFAULT_NAV_ICON: LucideIcon = Circle;

/**
 * Resuelve un nombre de icono (kebab-case) al componente Lucide.
 *
 * Ante `undefined`/`null`/nombre desconocido devuelve el default (`Circle`)
 * -- nunca lanza ni deja el llamador sin un componente valido para renderizar.
 */
export const resolveNavIcon = (name?: string | null): LucideIcon => {
  if (!name) return DEFAULT_NAV_ICON;
  return NAV_ICONS[name] ?? DEFAULT_NAV_ICON;
};
