import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, FileText, List, Loader2, Printer, RefreshCcw, Search, Settings2, Stethoscope } from "lucide-react";
import { SlotCalendar } from "@features/recepcion/modules/citas/components/SlotCalendar";
import { addDays } from "@features/recepcion/modules/citas/utils/dates";
import { useDebounce }           from "@shared/hooks/useDebounce";
import { useCitasList }          from "@features/recepcion/modules/citas/queries/useCitasList";
import { usePatientLookupHistorico }  from "@features/recepcion/modules/checkin/queries/usePatientLookup";
import { useVisitStatusLog }           from "@features/recepcion/modules/checkin/queries/useVisitStatusLog";
import { visitsAPI }                   from "@api/resources/visits.api";
import { TurnoIndicator } from "@features/recepcion/shared/components/TurnoIndicator";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Badge }  from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input }  from "@shared/ui/input";
import { Label }  from "@shared/ui/label";
import {
  ARRIVAL_TYPE,
  ESTATUS_CITA,
  RECEPCION_STATUS_ACTION,
  VISIT_STATUS,
  type CitaListItem,
  type EstatusCita,
  type VisitQueueItem,
  type VisitStatus,
} from "@api/types";
import { ApiError } from "@api/utils/errors";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { useVisitStatusAction } from "@features/recepcion/modules/checkin/mutations/useVisitStatusAction";
import { useRecepcionAgendaQueue } from "@features/recepcion/modules/agenda/queries/useRecepcionAgendaQueue";
import { RecepcionQuickCheckinDialog } from "@features/recepcion/modules/agenda/components/RecepcionQuickCheckinDialog";
import { mapVisitToCheckinDefaults } from "@features/recepcion/modules/checkin/domain/checkin.mappers";
import type { CheckinFormInput } from "@features/recepcion/modules/checkin/domain/checkin.schemas";
import { canRunRecepcionStatusAction } from "@features/operativo/shared/domain/visit-flow.constants";
import { FichaModal } from "@features/recepcion/shared/components/FichaModal";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useConsultoriosList } from "@features/admin/modules/catalogos/consultorios/queries/useConsultoriosList";
import { useMedicosList } from "@features/admin/modules/medicos/hooks/useMedicos";
import {
  RECEPCION_QUEUE_PERMISSION_REQUIREMENT,
  RECEPCION_WRITE_PERMISSION_REQUIREMENT,
} from "@features/recepcion/shared/domain/recepcion.permissions";
import {
  RECEPCION_SERVICE,
  RECEPCION_SERVICE_LIST,
  RECEPCION_SERVICE_PROFILES,
  resolveRecepcionService,
  type RecepcionService,
} from "@features/recepcion/shared/domain/recepcion.services";
import { RecepcionServiceBadge } from "@features/recepcion/shared/components/RecepcionServiceBadge";
import { RecepcionStatusBadge } from "@features/recepcion/shared/components/RecepcionStatusBadge";
import {
  formatArrivalTypeLabel,
  isOpenVisitStatus,
} from "@features/recepcion/shared/utils/recepcion-format";

// ─── Etiquetas de estado de visita ───────────────────────────────────────────

const VISIT_STATUS_LABEL: Record<string, string> = {
  en_espera:         "En espera",
  en_somatometria:   "En somatometría",
  lista_para_doctor: "Lista para doctor",
  en_consulta:       "En consulta",
  cerrada:           "Cerrada",
  cancelada:         "Cancelada",
  no_show:           "No se presentó",
};

const VISIT_BADGE_VARIANT: Record<string,
  "outline" | "stable" | "alert" | "secondary" | "critical"
> = {
  en_espera:         "outline",
  en_somatometria:   "alert",
  lista_para_doctor: "alert",
  en_consulta:       "stable",
  cerrada:           "secondary",
  cancelada:         "critical",
  no_show:           "critical",
};

// ─── Tarjeta de visita con movimientos expandibles ────────────────────────────

function HistVisitCard({ visit }: { visit: VisitQueueItem }) {
  const [expanded, setExpanded] = useState(false);
  const { data: log, isLoading: logLoading } = useVisitStatusLog(visit.id, expanded);

  return (
    <article className="rounded-xl border border-line-struct bg-paper overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-3 bg-subtle/20 border-b border-line-struct/50">
        <div>
          <p className="font-mono text-sm font-bold text-txt-body tracking-widest">{visit.folio}</p>
          <p className="text-[10px] text-txt-muted mt-0.5">Ficha de consulta · {visit.arrivalType === "appointment" ? "Con cita" : "Sin cita"}</p>
        </div>
        <Badge variant={VISIT_BADGE_VARIANT[visit.status] ?? "outline"} className="text-xs shrink-0">
          {VISIT_STATUS_LABEL[visit.status] ?? visit.status}
        </Badge>
      </div>

      {/* Datos */}
      <div className="px-5 py-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Fecha de registro</p>
          <p className="font-medium">{visit.fechaAlta ? formatCitaFechaHora(visit.fechaAlta) : "—"}</p>
        </div>
        {visit.doctorNombre ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Médico</p>
            <p className="font-medium">{visit.doctorNombre}</p>
          </div>
        ) : null}
        {visit.consultorioNombre ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Consultorio</p>
            <p className="font-medium">{visit.consultorioNombre}</p>
          </div>
        ) : null}
        {visit.horaConsulta ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Hora de cita</p>
            <p className="font-mono font-semibold text-primary">{visit.horaConsulta}</p>
          </div>
        ) : null}
        {visit.notes ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Motivo</p>
            <p className="text-txt-body/80 text-sm">{visit.notes}</p>
          </div>
        ) : null}
      </div>

      {/* Movimientos NOM-024 */}
      <div className="px-5 py-2.5 border-t border-line-struct/40 bg-subtle/10">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ChevronRight className={`size-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
          {expanded ? "Ocultar movimientos" : "Ver movimientos — auditoría NOM-024 §6"}
        </button>

        {expanded ? (
          <div className="mt-3">
            {logLoading ? (
              <div className="flex items-center gap-2 text-xs text-txt-muted py-1">
                <Loader2 className="size-3 animate-spin" /> Cargando historial de movimientos...
              </div>
            ) : log && log.length > 0 ? (
              <div className="space-y-0 pl-1 border-l-2 border-line-struct/40">
                {log.map((entry) => (
                  <div key={entry.id} className="relative flex items-start gap-3 py-2 pl-3">
                    <div className="absolute -left-[5px] top-3 size-2 rounded-full bg-primary/50 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1 text-xs">
                        {entry.fromStatus ? (
                          <span className="text-txt-muted">
                            {VISIT_STATUS_LABEL[entry.fromStatus] ?? entry.fromStatus}
                          </span>
                        ) : null}
                        {entry.fromStatus ? <span className="text-txt-muted">→</span> : null}
                        <span className="font-semibold text-txt-body">
                          {VISIT_STATUS_LABEL[entry.toStatus] ?? entry.toStatus}
                        </span>
                      </div>
                      <p className="text-[10px] text-txt-muted mt-0.5">
                        {new Date(entry.changedAt).toLocaleString("es-MX", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                          timeZone: "America/Mexico_City",
                        })}
                        {entry.changedByNombre ? ` · ${entry.changedByNombre}` : ""}
                      </p>
                      {entry.notes ? (
                        <p className="text-[10px] italic text-txt-muted/70 mt-0.5">{entry.notes}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-txt-muted py-1 italic">Sin movimientos registrados.</p>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

// ─── Tarjeta de médico — vista Disponibilidad ────────────────────────────────

interface DisponibilidadMedicoCardMedico {
  id: number;
  nombreCompleto: string;
  servicio: string | null;
  especialidades: { name: string }[];
  centros: { centroId: number; centroNombre: string }[];
  consultoriosActivos: { centroId: number; centroNombre: string; consultorioNumero: number; consultorioNombre: string }[];
}

function DisponibilidadMedicoCard({
  medico,
  centroFiltroId,
  selected,
  onSelect,
}: {
  medico:         DisponibilidadMedicoCardMedico;
  centroFiltroId: number | null;
  selected:       boolean;
  onSelect:       () => void;
}) {
  const especialidad = medico.especialidades[0]?.name ?? medico.servicio;

  // Si hay centro filtrado, mostrar solo lo relativo a ese centro; si no, todos.
  const centros = centroFiltroId
    ? medico.centros.filter((c) => c.centroId === centroFiltroId)
    : medico.centros;
  const consultorios = centroFiltroId
    ? medico.consultoriosActivos.filter((c) => c.centroId === centroFiltroId)
    : medico.consultoriosActivos;

  const centroLabel = centros.map((c) => c.centroNombre).join(", ");
  const consultorioLabel = consultorios.map((c) => `#${c.consultorioNumero}`).join(", ");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-line-struct hover:bg-subtle/40",
      ].join(" ")}
    >
      <div
        className={[
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-primary text-white" : "bg-subtle text-txt-muted",
        ].join(" ")}
      >
        <Stethoscope className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={[
          "truncate text-sm font-semibold",
          selected ? "text-primary" : "text-txt-body",
        ].join(" ")}>
          {medico.nombreCompleto}
        </p>
        {especialidad ? (
          <p className="truncate text-xs text-txt-muted">{especialidad}</p>
        ) : null}
        {centroLabel ? (
          <p className="truncate text-[11px] text-txt-muted/80 mt-0.5">{centroLabel}</p>
        ) : null}
        {consultorioLabel ? (
          <p className="truncate text-[11px] font-medium text-primary/70">
            Consultorio {consultorioLabel}
          </p>
        ) : null}
      </div>
    </button>
  );
}

// ─── Constantes historial NOM-024 ────────────────────────────────────────────

const ESTATUS_LABEL: Record<EstatusCita, string> = {
  agendada:   "Agendada",
  confirmada: "Confirmada",
  atendida:   "Atendida",
  cancelada:  "Cancelada",
  no_asistio: "No asistió",
};

const ESTATUS_VARIANT: Record<EstatusCita,
  "outline" | "stable" | "alert" | "secondary" | "critical"
> = {
  agendada:   "outline",
  confirmada: "stable",
  atendida:   "secondary",
  cancelada:  "critical",
  no_asistio: "alert",
};

function formatCitaFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Mexico_City",
  });
}

function getBandejaPeriodRange(period: string, customDesde: string, customHasta: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const todayStr = fmt(today);
  switch (period) {
    case "week": {
      const d = new Date(today);
      const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      return { fechaDesde: fmt(d), fechaHasta: todayStr };
    }
    case "month":  return { fechaDesde: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), fechaHasta: todayStr };
    case "year":   return { fechaDesde: `${today.getFullYear()}-01-01`, fechaHasta: todayStr };
    case "custom": return { fechaDesde: customDesde, fechaHasta: customHasta };
    default:       return { fechaDesde: todayStr, fechaHasta: todayStr };
  }
}

const BANDEJA_PERIOD_LABEL: Record<string, string> = {
  today:  "Hoy (tiempo real)",
  week:   "Esta semana",
  month:  "Este mes",
  year:   "Este año",
  custom: "Personalizado",
};

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().slice(0, 10);
}

function formatWeekRange(weekStart: string): string {
  const from = new Date(weekStart + "T00:00:00");
  const to   = new Date(addDays(weekStart, 6) + "T00:00:00");
  const fmt  = (d: Date) => d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  return `${fmt(from)} — ${fmt(to)}`;
}

const RECEPCION_ACTION = {
  EN_SOMATOMETRIA: RECEPCION_STATUS_ACTION.EN_SOMATOMETRIA,
  CANCELADA: RECEPCION_STATUS_ACTION.CANCELADA,
  NO_SHOW: RECEPCION_STATUS_ACTION.NO_SHOW,
} as const;

type RecepcionAction = (typeof RECEPCION_ACTION)[keyof typeof RECEPCION_ACTION];

interface PendingStatusAction {
  visitId: number;
  folio: string;
  targetStatus: RecepcionAction;
}

const RECEPCION_ACTION_COPY: Record<
  RecepcionAction,
  {
    label: string;
    confirmLabel: string;
    successMessage: string;
    getDescription: (folio: string) => string;
  }
> = {
  [RECEPCION_ACTION.EN_SOMATOMETRIA]: {
    label: "Llego",
    confirmLabel: "Enviar a somatometria",
    successMessage: "Paciente enviado a somatometria.",
    getDescription: (folio) =>
      `Vas a marcar la visita ${folio} como llegada y enviarla a somatometria.`,
  },
  [RECEPCION_ACTION.CANCELADA]: {
    label: "Cancelada",
    confirmLabel: "Marcar cancelada",
    successMessage: "Visita marcada como cancelada.",
    getDescription: (folio) =>
      `Vas a marcar la visita ${folio} como cancelada. Esta accion no se puede deshacer.`,
  },
  [RECEPCION_ACTION.NO_SHOW]: {
    label: "No llego",
    confirmLabel: "Marcar no llego",
    successMessage: "Visita marcada como no show.",
    getDescription: (folio) =>
      `Vas a marcar la visita ${folio} como no llegada. Esta accion no se puede deshacer.`,
  },
};

const VISIT_STATUS_DOMAIN_ERROR_MESSAGE: Record<
  | "ROLE_NOT_ALLOWED"
  | "VISIT_STATE_INVALID"
  | "VISIT_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "PERMISSION_DENIED",
  string
> = {
  ROLE_NOT_ALLOWED: "No tenes permiso para actualizar estados en recepcion.",
  VISIT_STATE_INVALID:
    "La visita ya no esta en un estado valido para esta accion. Actualiza la cola.",
  VISIT_NOT_FOUND: "La visita ya no existe o fue cerrada por otro usuario.",
  VALIDATION_ERROR: "No se pudo procesar la accion solicitada.",
  PERMISSION_DENIED: "No tenes permiso para ejecutar esta accion.",
};

const FALLBACK_VISIT_STATUS_ERROR_MESSAGE =
  "No se pudo actualizar el estado de la visita. Intenta nuevamente.";

const RETRYABLE_STATUS_ACTION_ERRORS = [
  "VISIT_STATE_INVALID",
  "VISIT_NOT_FOUND",
] as const;

const STATUS_FILTER = {
  ALL: "all",
  OPEN: "open",
  EN_ESPERA: VISIT_STATUS.EN_ESPERA,
  EN_SOMATOMETRIA: VISIT_STATUS.EN_SOMATOMETRIA,
  LISTA_PARA_DOCTOR: VISIT_STATUS.LISTA_PARA_DOCTOR,
  EN_CONSULTA: VISIT_STATUS.EN_CONSULTA,
  CERRADA: VISIT_STATUS.CERRADA,
  CANCELADA: VISIT_STATUS.CANCELADA,
  NO_SHOW: VISIT_STATUS.NO_SHOW,
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const ARRIVAL_TYPE_FILTER = {
  ALL: "all",
  APPOINTMENT: ARRIVAL_TYPE.APPOINTMENT,
  WALK_IN: ARRIVAL_TYPE.WALK_IN,
} as const;

type ArrivalTypeFilter =
  (typeof ARRIVAL_TYPE_FILTER)[keyof typeof ARRIVAL_TYPE_FILTER];

const SERVICE_FILTER = {
  ALL: "all",
  MEDICINA_GENERAL: RECEPCION_SERVICE.MEDICINA_GENERAL,
  ESPECIALIDAD: RECEPCION_SERVICE.ESPECIALIDAD,
  URGENCIAS: RECEPCION_SERVICE.URGENCIAS,
} as const;

type ServiceFilter = (typeof SERVICE_FILTER)[keyof typeof SERVICE_FILTER];

const getOpenPriority = (visitStatus: VisitStatus): number =>
  isOpenVisitStatus(visitStatus) ? 0 : 1;

const getUrgenciasPriority = (visit: VisitQueueItem): number =>
  resolveRecepcionService(visit) === RECEPCION_SERVICE.URGENCIAS ? 0 : 1;

const getArrivalTypePriority = (visit: VisitQueueItem): number =>
  visit.arrivalType === ARRIVAL_TYPE.APPOINTMENT ? 0 : 1;

const matchesStatus = (
  visit: VisitQueueItem,
  statusFilter: StatusFilter,
): boolean => {
  if (statusFilter === STATUS_FILTER.ALL) {
    return true;
  }

  if (statusFilter === STATUS_FILTER.OPEN) {
    return isOpenVisitStatus(visit.status);
  }

  return visit.status === statusFilter;
};

const matchesArrivalType = (
  visit: VisitQueueItem,
  arrivalTypeFilter: ArrivalTypeFilter,
): boolean => {
  if (arrivalTypeFilter === ARRIVAL_TYPE_FILTER.ALL) {
    return true;
  }

  return visit.arrivalType === arrivalTypeFilter;
};

const matchesService = (
  visitService: RecepcionService,
  serviceFilter: ServiceFilter,
): boolean => {
  if (serviceFilter === SERVICE_FILTER.ALL) {
    return true;
  }

  return visitService === serviceFilter;
};

const matchesSearch = (visit: VisitQueueItem, searchTerm: string): boolean => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  const noExp         = visit.noExp.toLowerCase();
  const folio         = visit.folio.toLowerCase();
  const appointmentId = (visit.appointmentId ?? "").toLowerCase();

  return (
    folio.includes(normalizedSearch) ||
    noExp.includes(normalizedSearch) ||
    appointmentId.includes(normalizedSearch)
  );
};

const sortAgendaVisits = (
  firstVisit: VisitQueueItem,
  secondVisit: VisitQueueItem,
) => {
  const openPriorityDifference =
    getOpenPriority(firstVisit.status) - getOpenPriority(secondVisit.status);

  if (openPriorityDifference !== 0) {
    return openPriorityDifference;
  }

  if (
    isOpenVisitStatus(firstVisit.status) &&
    isOpenVisitStatus(secondVisit.status)
  ) {
    const urgenciasPriorityDifference =
      getUrgenciasPriority(firstVisit) - getUrgenciasPriority(secondVisit);

    if (urgenciasPriorityDifference !== 0) {
      return urgenciasPriorityDifference;
    }

    const arrivalTypePriorityDifference =
      getArrivalTypePriority(firstVisit) - getArrivalTypePriority(secondVisit);

    if (arrivalTypePriorityDifference !== 0) {
      return arrivalTypePriorityDifference;
    }
  }

  return firstVisit.folio.localeCompare(secondVisit.folio, "es");
};

const resolveDomainErrorMessage = <TDomainCode extends string>(
  error: unknown,
  domainErrors: Record<TDomainCode, string>,
  fallback: string,
): string => {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  const domainCode = error.code as TDomainCode;
  if (Object.prototype.hasOwnProperty.call(domainErrors, domainCode)) {
    return domainErrors[domainCode];
  }

  return error.message || fallback;
};

const shouldRefreshQueueAfterError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) {
    return false;
  }

  return RETRYABLE_STATUS_ACTION_ERRORS.includes(
    error.code as (typeof RETRYABLE_STATUS_ACTION_ERRORS)[number],
  );
};

export const RecepcionAgendaPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldFocusCheckin = searchParams.get("focus") === "checkin";
  const focusFolio = searchParams.get("folio");

  const { hasCapability } = usePermissionDependencies();
  const canReadAgenda = hasCapability(
    "flow.visits.queue.read",
    RECEPCION_QUEUE_PERMISSION_REQUIREMENT,
  );
  const canWriteRecepcion = hasCapability(
    "flow.recepcion.queue.write",
    RECEPCION_WRITE_PERMISSION_REQUIREMENT,
  );
  const queueQuery = useRecepcionAgendaQueue({ enabled: canReadAgenda });
  const visitStatusAction = useVisitStatusAction();

  const [view,         setView]         = useState<"bandeja" | "disponibilidad" | "historial">("bandeja");
  const [calCentroId,  setCalCentroId]  = useState<number | null>(null);
  const [calMedicoId,  setCalMedicoId]  = useState<number | null>(null);
  const [calWeekStart, setCalWeekStart] = useState(() => getMonday(new Date()));
  const [medicoSearch, setMedicoSearch] = useState("");

  // ── Historial NOM-024 ───────────────────────────────────────────────────────
  const [histNoExp,         setHistNoExp]         = useState("");
  const [histFechaDesde,    setHistFechaDesde]    = useState("");
  const [histFechaHasta,    setHistFechaHasta]    = useState("");
  const [histSelectedPkNum, setHistSelectedPkNum] = useState<number | null>(null);
  const [histTab,           setHistTab]           = useState<"citas" | "visitas">("citas");

  const histDebouncedNoExp = useDebounce(histNoExp, 400);
  const histEnabled = view === "historial" && canReadAgenda && histDebouncedNoExp.trim().length >= 4;

  const { data: histPatient } = usePatientLookupHistorico(histDebouncedNoExp.trim(), histEnabled);

  // Citas del expediente (filtradas por pkNum client-side)
  const { data: histCitasData, isLoading: histCitasLoading } = useCitasList(
    { noExp: histDebouncedNoExp.trim() || undefined, pageSize: 500,
      fechaDesde: histFechaDesde || undefined, fechaHasta: histFechaHasta || undefined },
    { enabled: histEnabled },
  );
  const histCitas = [...(histCitasData?.items ?? [])]
    .filter((c) => histSelectedPkNum === null || c.pkNum === histSelectedPkNum)
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

  // Visitas (fichas) del expediente — para movimientos NOM-024
  const { data: histVisitsData, isLoading: histVisitsLoading } = useQuery({
    queryKey: ["hist-visits", histDebouncedNoExp.trim(), histFechaDesde, histFechaHasta],
    queryFn:  () => visitsAPI.getAll({ noExp: histDebouncedNoExp.trim(), pageSize: 500 }),
    enabled:  histEnabled,
    staleTime: 30_000,
  });
  const histVisits = [...(histVisitsData?.items ?? [])]
    .filter((v) => histSelectedPkNum === null || v.pkNum === histSelectedPkNum)
    .sort((a, b) => new Date(b.fechaAlta ?? 0).getTime() - new Date(a.fechaAlta ?? 0).getTime());

  // Reset member selector al cambiar expediente
  const prevNoExp = useDebounce(histNoExp, 600);
  if (prevNoExp !== histNoExp && histSelectedPkNum !== null) {
    setHistSelectedPkNum(null);
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    STATUS_FILTER.OPEN,
  );
  const [arrivalTypeFilter, setArrivalTypeFilter] = useState<ArrivalTypeFilter>(
    ARRIVAL_TYPE_FILTER.ALL,
  );
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>(
    SERVICE_FILTER.ALL,
  );
  const [doctorFilter,      setDoctorFilter]      = useState<number | "all">("all");
  const [consultorioFilter, setConsultorioFilter] = useState<number | "all">("all");
  const [centroFilter,      setCentroFilter]      = useState<number | "all">("all");
  const [fichaOpen, setFichaOpen] = useState(false);
  const [fichaVisit, setFichaVisit] = useState<VisitQueueItem | null>(null);

  // ── Período histórico de la bandeja ────────────────────────────────────────
  const [bandejaPeriod, setBandejaPeriod] = useState("today");
  const [bandejaCustomDesde, setBandejaCustomDesde] = useState("");
  const [bandejaCustomHasta, setBandejaCustomHasta] = useState("");
  const [bandejaPage, setBandejaPage] = useState(1);

  const bandejaIsHistorical = bandejaPeriod !== "today";
  const { fechaDesde: bFechaDesde, fechaHasta: bFechaHasta } =
    getBandejaPeriodRange(bandejaPeriod, bandejaCustomDesde, bandejaCustomHasta);
  const bandejaCanQuery = bandejaIsHistorical && Boolean(bFechaDesde) && Boolean(bFechaHasta);

  const {
    data: historicalData,
    isLoading: historicalLoading,
    isFetching: historicalFetching,
    isError: historicalIsError,
    refetch: historicalRefetch,
  } = useQuery({
    queryKey: ["bandeja-historica", bFechaDesde, bFechaHasta, bandejaPage, statusFilter, serviceFilter],
    queryFn: () =>
      visitsAPI.getAll({
        page: bandejaPage,
        pageSize: 50,
        fechaDesde: bFechaDesde || undefined,
        fechaHasta: bFechaHasta || undefined,
        status:
          statusFilter !== STATUS_FILTER.ALL && statusFilter !== STATUS_FILTER.OPEN
            ? (statusFilter as VisitStatus)
            : undefined,
        serviceType:
          serviceFilter !== SERVICE_FILTER.ALL
            ? (serviceFilter as "medicina_general" | "especialidad" | "urgencias")
            : undefined,
      }),
    enabled: bandejaCanQuery,
    staleTime: 60_000,
  });

  const [quickCheckinOpen, setQuickCheckinOpen] = useState(
    () => shouldFocusCheckin,
  );
  const [quickCheckinDefaults, setQuickCheckinDefaults] = useState<
    Partial<CheckinFormInput> | undefined
  >(undefined);
  const [pendingStatusAction, setPendingStatusAction] =
    useState<PendingStatusAction | null>(null);

  const visits = bandejaIsHistorical
    ? (historicalData?.items ?? [])
    : (queueQuery.data?.items ?? []);
  const openVisits = visits.filter((visit) => isOpenVisitStatus(visit.status));
  const waitingCount = visits.filter(
    (visit) => visit.status === VISIT_STATUS.EN_ESPERA,
  ).length;
  const withAppointmentCount = openVisits.filter(
    (visit) => visit.arrivalType === ARRIVAL_TYPE.APPOINTMENT,
  ).length;
  const walkInCount = openVisits.filter(
    (visit) => visit.arrivalType === ARRIVAL_TYPE.WALK_IN,
  ).length;
  const serviceCounts = openVisits.reduce<Record<RecepcionService, number>>(
    (accumulator, visit) => {
      const service = resolveRecepcionService(visit);
      return {
        ...accumulator,
        [service]: (accumulator[service] ?? 0) + 1,
      };
    },
    {
      [RECEPCION_SERVICE.MEDICINA_GENERAL]: 0,
      [RECEPCION_SERVICE.ESPECIALIDAD]: 0,
      [RECEPCION_SERVICE.URGENCIAS]: 0,
      [RECEPCION_SERVICE.SIN_CLASIFICAR]: 0,
    },
  );
  const activeDoctorCount = new Set(
    openVisits
      .map((visit) => visit.doctorId)
      .filter((doctorId): doctorId is number => typeof doctorId === "number"),
  ).size;
  const openVisitsWithoutDoctorCount = openVisits.filter(
    (visit) => visit.doctorId == null,
  ).length;

  // ── Catálogos reales para filtros (carga única, filtrado client-side) ────────
  // Estrategia: cargar TODO una sola vez al montar; filtrar en memoria.
  // Sin llamadas extra al cambiar filtros → O(1) por interacción.

  const { data: centrosData } = useCentrosAtencionList({ isActive: true });
  const centroOptions = (centrosData?.items ?? []).map((c) => ({ id: c.id, nombre: c.name }));

  const { data: consultoriosData } = useConsultoriosList(
    { isActive: true, pageSize: 500 },
  );
  const allConsultorios = consultoriosData?.items ?? [];

  const { data: medicosData } = useMedicosList({ estatusMedico: "ACTIVO" });
  const allMedicos = medicosData?.items ?? [];

  // Filtrado client-side: si hay centro seleccionado → solo los de ese centro
  const selectedCentroId = centroFilter !== "all" ? centroFilter : null;

  const consultorioOptions = (
    selectedCentroId
      ? allConsultorios.filter((c) => c.centerId === selectedCentroId)
      : allConsultorios
  ).map((c) => ({ id: c.id, nombre: `#${c.numero} — ${c.name}` }));

  const doctorOptions = (
    selectedCentroId
      ? allMedicos.filter((m) =>
          m.centros.some((mc) => mc.centroId === selectedCentroId),
        )
      : allMedicos
  ).map((m) => ({ id: m.id, nombre: m.nombreCompleto }));

  // ── Listado visual de médicos — vista Disponibilidad ──────────────────────
  const disponibilidadMedicos = (calCentroId
    ? allMedicos.filter((m) => m.centros.some((c) => c.centroId === calCentroId))
    : allMedicos
  ).filter((m) =>
    m.nombreCompleto.toLowerCase().includes(medicoSearch.trim().toLowerCase()),
  );

  const filteredVisits = visits
    .filter((visit) => matchesStatus(visit, statusFilter))
    .filter((visit) => matchesArrivalType(visit, arrivalTypeFilter))
    .filter((visit) => matchesSearch(visit, searchTerm))
    .filter((visit) => {
      const service = resolveRecepcionService(visit);
      return matchesService(service, serviceFilter);
    })
    .filter((visit) => doctorFilter      === "all" || visit.doctorId      === doctorFilter)
    .filter((visit) => consultorioFilter === "all" || visit.consultorioId === consultorioFilter)
    .filter((visit) => centroFilter      === "all" || visit.centroId      === centroFilter)
    .sort(sortAgendaVisits);
  const legacyFocusedVisit = focusFolio
    ? visits.find((visit) => visit.folio === focusFolio)
    : undefined;
  const resolvedQuickCheckinDefaults =
    quickCheckinDefaults ||
    (shouldFocusCheckin && legacyFocusedVisit
      ? mapVisitToCheckinDefaults(legacyFocusedVisit)
      : undefined);
  const pendingActionCopy = pendingStatusAction
    ? RECEPCION_ACTION_COPY[pendingStatusAction.targetStatus]
    : null;

  const handleOpenQuickCheckin = (defaults?: Partial<CheckinFormInput>) => {
    setQuickCheckinDefaults(defaults);
    setQuickCheckinOpen(true);
  };

  const openStatusActionConfirmation = (
    visitId: number,
    folio: string,
    targetStatus: RecepcionAction,
  ) => {
    if (!canWriteRecepcion || visitStatusAction.isPending) {
      return;
    }

    setPendingStatusAction({ visitId, folio, targetStatus });
  };

  const handleConfirmStatusAction = async () => {
    if (!pendingStatusAction) {
      return;
    }

    try {
      await visitStatusAction.mutateAsync({
        visitId: pendingStatusAction.visitId,
        targetStatus: pendingStatusAction.targetStatus,
      });

      toast.success(
        RECEPCION_ACTION_COPY[pendingStatusAction.targetStatus].successMessage,
      );
    } catch (error) {
      if (shouldRefreshQueueAfterError(error)) {
        void queueQuery.refetch?.();
      }

      toast.error("No se pudo actualizar el estado", {
        description: resolveDomainErrorMessage(
          error,
          VISIT_STATUS_DOMAIN_ERROR_MESSAGE,
          FALLBACK_VISIT_STATUS_ERROR_MESSAGE,
        ),
      });
    } finally {
      setPendingStatusAction(null);
    }
  };

  return (
    <section className="space-y-5 p-6">
      <header className="flex flex-col gap-3 rounded-xl border border-line-struct bg-paper p-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-line-hairline bg-subtle px-3 py-1 text-xs font-medium text-txt-muted">
            <CalendarClock className="size-3.5" />
            Centro de recepcion
          </div>
          <h1 className="text-2xl font-semibold text-txt-body">
            Citas y check-in operativo
          </h1>
          <p className="max-w-2xl text-sm text-txt-muted">
            Gestiona check-in de pacientes y agenda de citas con contexto
            operativo en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-line-struct bg-subtle/20 p-1">
            <button
              type="button"
              onClick={() => setView("bandeja")}
              className={[
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "bandeja"
                  ? "bg-paper text-txt-body shadow-sm"
                  : "text-txt-muted hover:text-txt-body",
              ].join(" ")}
            >
              <List className="size-3.5" /> Bandeja
            </button>
            <button
              type="button"
              onClick={() => setView("disponibilidad")}
              className={[
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "disponibilidad"
                  ? "bg-paper text-txt-body shadow-sm"
                  : "text-txt-muted hover:text-txt-body",
              ].join(" ")}
            >
              <CalendarDays className="size-3.5" /> Disponibilidad
            </button>
            <button
              type="button"
              onClick={() => setView("historial")}
              className={[
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "historial"
                  ? "bg-paper text-txt-body shadow-sm"
                  : "text-txt-muted hover:text-txt-body",
              ].join(" ")}
            >
              <ClipboardList className="size-3.5" /> Historial
            </button>
          </div>

          <TurnoIndicator />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9"
            title="Configurar turnos y fichas"
            onClick={() => navigate("/recepcion/turnos")}
          >
            <Settings2 className="size-4" />
          </Button>
          {view === "bandeja" && !bandejaIsHistorical ? (
            <span className="rounded-full border border-line-hairline bg-subtle px-3 py-1 text-xs font-medium text-txt-muted">
              Sync: {queueQuery.connectionStatus ?? "idle"}
            </span>
          ) : null}
          <Button
            type="button"
            onClick={() => handleOpenQuickCheckin()}
            disabled={!canWriteRecepcion}
          >
            Generar ficha de consulta
          </Button>
          {view === "bandeja" ? (
            <Button
              type="button"
              variant="ghost"
              className="gap-2"
              onClick={() => bandejaIsHistorical ? void historicalRefetch() : void queueQuery.refetch?.()}
            >
              <RefreshCcw className="size-4" />
              Actualizar
            </Button>
          ) : null}
        </div>
      </header>

      {/* ── Vista disponibilidad ────────────────────────────────────── */}
      {view === "disponibilidad" ? (
        <div className="space-y-4 rounded-xl border border-line-struct/60 bg-subtle/10 p-4">

          {/* Controles: centro + navegación semana */}
          <div className="flex flex-wrap items-end gap-3">

            {/* Filtro centro */}
            {centroOptions.length > 1 ? (
              <div className="space-y-1 w-52">
                <p className="text-xs font-medium text-txt-muted">Centro de atención</p>
                <select
                  className="h-9 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                  value={calCentroId ?? ""}
                  onChange={(e) => {
                    setCalCentroId(e.target.value ? Number(e.target.value) : null);
                    setCalMedicoId(null);
                  }}
                >
                  <option value="">Todos los centros</option>
                  {centroOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Navegación de semana */}
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-8"
                disabled={calWeekStart <= getMonday(new Date())}
                onClick={() => setCalWeekStart((s) => addDays(s, -7))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-2 text-sm text-txt-muted whitespace-nowrap">
                {formatWeekRange(calWeekStart)}
              </span>
              <Button variant="ghost" size="icon" className="size-8"
                onClick={() => setCalWeekStart((s) => addDays(s, 7))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Maestro-detalle: listado de médicos + grilla de slots */}
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">

            {/* Lista de médicos */}
            <div className="space-y-3 rounded-xl border border-line-struct bg-paper p-3 lg:max-h-[640px] lg:overflow-y-auto">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-txt-muted">
                  Médicos {disponibilidadMedicos.length > 0 ? `(${disponibilidadMedicos.length})` : ""}
                </p>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-txt-muted pointer-events-none" />
                  <Input
                    placeholder="Buscar médico..."
                    value={medicoSearch}
                    onChange={(e) => setMedicoSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>

              {disponibilidadMedicos.length === 0 ? (
                <p className="py-6 text-center text-xs text-txt-muted">
                  Sin médicos para los filtros aplicados.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {disponibilidadMedicos.map((m) => (
                    <DisponibilidadMedicoCard
                      key={m.id}
                      medico={m}
                      centroFiltroId={calCentroId}
                      selected={calMedicoId === m.id}
                      onSelect={() => setCalMedicoId(m.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Grilla de slots */}
            <div>
              {calMedicoId ? (
                <SlotCalendar
                  medicoId={calMedicoId}
                  medicoNombre={allMedicos.find((m) => m.id === calMedicoId)?.nombreCompleto}
                  weekStart={calWeekStart}
                  onSlotClick={(fecha, slot) => {
                    handleOpenQuickCheckin({
                      doctorId:      calMedicoId,
                      consultorioId: slot.consultorioId ?? undefined,
                      horaConsulta:  slot.hora,
                      fechaConsulta: fecha,
                      arrivalType:   ARRIVAL_TYPE.WALK_IN,
                    });
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <CalendarDays className="size-12 text-txt-muted/30" />
                  <p className="text-sm text-txt-muted">
                    Selecciona un médico de la lista para ver su disponibilidad semanal.
                  </p>
                  <p className="text-xs text-txt-muted/70">
                    Los slots en verde están disponibles — hacé clic para generar una ficha.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Vista bandeja ────────────────────────────────────────────── */}
      {view === "bandeja" && !canReadAgenda ? (
        <p className="text-sm text-txt-muted" role="status">
          No tenes permisos completos para cargar la agenda operativa de
          recepcion.
        </p>
      ) : null}

      {/* ── Selector de período ───────────────────────────────────────── */}
      {view === "bandeja" && canReadAgenda ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line-struct bg-paper px-4 py-3">
          {Object.keys(BANDEJA_PERIOD_LABEL).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setBandejaPeriod(p); setBandejaPage(1); }}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors",
                bandejaPeriod === p
                  ? "border-primary bg-primary text-white"
                  : "border-line-struct bg-subtle/30 text-txt-muted hover:text-txt-body hover:bg-subtle",
              ].join(" ")}
            >
              {BANDEJA_PERIOD_LABEL[p]}
            </button>
          ))}
          {bandejaPeriod === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={bandejaCustomDesde}
                onChange={(e) => { setBandejaCustomDesde(e.target.value); setBandejaPage(1); }}
                className="h-8 rounded-md border border-line-struct bg-paper px-2 text-xs"
              />
              <span className="text-xs text-txt-muted">→</span>
              <input
                type="date"
                value={bandejaCustomHasta}
                min={bandejaCustomDesde}
                onChange={(e) => { setBandejaCustomHasta(e.target.value); setBandejaPage(1); }}
                className="h-8 rounded-md border border-line-struct bg-paper px-2 text-xs"
              />
            </div>
          )}
          {bandejaIsHistorical && (historicalFetching) && (
            <span className="ml-auto text-xs text-txt-muted">Cargando...</span>
          )}
        </div>
      ) : null}

      {view === "bandeja" && canReadAgenda && (bandejaIsHistorical ? historicalLoading : queueQuery.isLoading) ? (
        <p className="text-sm text-txt-muted">
          Cargando agenda de recepcion...
        </p>
      ) : null}

      {view === "bandeja" && canReadAgenda && (bandejaIsHistorical ? historicalIsError : queueQuery.isError) ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>
            No se pudo cargar la agenda operativa de recepcion.
          </AlertDescription>
        </Alert>
      ) : null}

      {view === "bandeja" &&
      canReadAgenda &&
      !(bandejaIsHistorical ? historicalLoading : queueQuery.isLoading) &&
      !(bandejaIsHistorical ? historicalIsError : queueQuery.isError) &&
      visits.length > 0 ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-line-struct bg-paper p-4">
              <p className="text-sm text-txt-muted">Visitas abiertas</p>
              <p className="text-2xl font-semibold text-txt-body">
                {openVisits.length}
              </p>
            </article>
            <article className="rounded-xl border border-line-struct bg-paper p-4">
              <p className="text-sm text-txt-muted">En espera</p>
              <p className="text-2xl font-semibold text-txt-body">
                {waitingCount}
              </p>
            </article>
            <article className="rounded-xl border border-line-struct bg-paper p-4">
              <p className="text-sm text-txt-muted">Doctores con carga</p>
              <p className="text-2xl font-semibold text-txt-body">
                {activeDoctorCount}
              </p>
            </article>
            <article className="rounded-xl border border-line-struct bg-paper p-4">
              <p className="text-sm text-txt-muted">Pendientes de asignacion</p>
              <p className="text-2xl font-semibold text-txt-body">
                {openVisitsWithoutDoctorCount}
              </p>
            </article>
          </section>

          <section className="rounded-xl border border-line-struct bg-subtle p-3">
            <p className="text-sm text-txt-muted" role="status">
              Resumen operativo: {withAppointmentCount} con cita, {walkInCount}{" "}
              sin cita, medicina general{" "}
              {serviceCounts[RECEPCION_SERVICE.MEDICINA_GENERAL]}, especialidad{" "}
              {serviceCounts[RECEPCION_SERVICE.ESPECIALIDAD]}, urgencias{" "}
              {serviceCounts[RECEPCION_SERVICE.URGENCIAS]}, {activeDoctorCount}{" "}
              doctores con carga.
            </p>
          </section>

          <section className="space-y-4 rounded-xl border border-line-struct bg-paper p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="agenda-search">
                  Buscar por folio, paciente o cita
                </Label>
                <Input
                  id="agenda-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Ej. VST-001, 1234, APP-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenda-status-filter">Estado</Label>
                <select
                  id="agenda-status-filter"
                  className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                >
                  <option value={STATUS_FILTER.OPEN}>Abiertas</option>
                  <option value={STATUS_FILTER.ALL}>Todas</option>
                  <option value={STATUS_FILTER.EN_ESPERA}>En espera</option>
                  <option value={STATUS_FILTER.EN_SOMATOMETRIA}>
                    En somatometria
                  </option>
                  <option value={STATUS_FILTER.LISTA_PARA_DOCTOR}>
                    Lista para doctor
                  </option>
                  <option value={STATUS_FILTER.EN_CONSULTA}>En consulta</option>
                  <option value={STATUS_FILTER.CERRADA}>Cerrada</option>
                  <option value={STATUS_FILTER.CANCELADA}>Cancelada</option>
                  <option value={STATUS_FILTER.NO_SHOW}>No show</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agenda-arrival-filter">Tipo de llegada</Label>
                <select
                  id="agenda-arrival-filter"
                  className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                  value={arrivalTypeFilter}
                  onChange={(event) => {
                    setArrivalTypeFilter(
                      event.target.value as ArrivalTypeFilter,
                    );
                  }}
                >
                  <option value={ARRIVAL_TYPE_FILTER.ALL}>Todos</option>
                  <option value={ARRIVAL_TYPE_FILTER.APPOINTMENT}>
                    Con cita
                  </option>
                  <option value={ARRIVAL_TYPE_FILTER.WALK_IN}>Sin cita</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenda-service-filter">Servicio</Label>
                <select
                  id="agenda-service-filter"
                  className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                  value={serviceFilter}
                  onChange={(event) => {
                    setServiceFilter(event.target.value as ServiceFilter);
                  }}
                >
                  <option value={SERVICE_FILTER.ALL}>Todos</option>
                  {RECEPCION_SERVICE_LIST.map((service) => (
                    <option key={service} value={service}>
                      {RECEPCION_SERVICE_PROFILES[service].label}
                    </option>
                  ))}
                </select>
              </div>
              

              
              <div className="space-y-2">
                <Label htmlFor="agenda-centro-filter">Centro de atención</Label>
                <select
                  id="agenda-centro-filter"
                  className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                  value={centroFilter === "all" ? "all" : String(centroFilter)}
                  onChange={(e) => {
                    setCentroFilter(e.target.value === "all" ? "all" : Number(e.target.value));
                    setConsultorioFilter("all");
                    setDoctorFilter("all");
                  }}
                >
                  <option value="all">Todos los centros</option>
                  {centroOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="agenda-cons-filter">Consultorio</Label>
                <select
                  id="agenda-cons-filter"
                  className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                  value={consultorioFilter === "all" ? "all" : String(consultorioFilter)}
                  onChange={(e) =>
                    setConsultorioFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                  }
                >
                  <option value="all">Todos los consultorios</option>
                  {consultorioOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenda-doctor-filter">Médico</Label>
                <select
                  id="agenda-doctor-filter"
                  className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                  value={doctorFilter === "all" ? "all" : String(doctorFilter)}
                  onChange={(e) =>
                    setDoctorFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                  }
                >
                  <option value="all">Todos los médicos</option>
                  {doctorOptions.map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredVisits.length === 0 ? (
              <p className="text-sm text-txt-muted">
                No hay resultados para los filtros aplicados.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredVisits.map((visit) => {
                  const visitService = resolveRecepcionService(visit);
                  const canRunAction = canRunRecepcionStatusAction(
                    visit.status,
                  );
                  const canMarkNoShow =
                    visit.arrivalType === ARRIVAL_TYPE.APPOINTMENT;
                  const actionDisabled =
                    !canRunAction ||
                    !canWriteRecepcion ||
                    visitStatusAction.isPending;

                  return (
                    <article
                      key={visit.id}
                      className="flex flex-col gap-0 rounded-xl border border-line-struct bg-paper overflow-hidden"
                    >
                      {/* ── Banda superior: ficha + estado ─────────────── */}
                      <div className="flex items-center justify-between gap-2 border-b border-line-hairline bg-subtle/30 px-4 py-2">
                        <div className="flex items-center gap-2">
                          {visit.numFicha ? (
                            <span className="text-2xl font-black text-primary leading-none">
                              #{visit.numFicha}
                            </span>
                          ) : null}
                          {visit.turnoNombre ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
                              {visit.turnoNombre}
                            </span>
                          ) : null}
                          <span className="font-mono text-xs text-txt-muted">{visit.folio}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Ver e imprimir ficha"
                            className="rounded-lg p-1.5 text-txt-muted hover:bg-subtle hover:text-primary transition-colors"
                            onClick={() => { setFichaVisit(visit); setFichaOpen(true); }}
                          >
                            <Printer className="size-4" />
                          </button>
                          <RecepcionStatusBadge status={visit.status} />
                        </div>
                      </div>

                      {/* ── Datos del paciente ──────────────────────────── */}
                      <div className="px-4 pt-3 pb-2">
                        {visit.nombrePaciente ? (
                          <p className="text-base font-bold text-txt-body truncate">
                            {visit.nombrePaciente}
                          </p>
                        ) : null}
                        <p className="mt-0.5 font-mono text-xs text-txt-muted">
                          Exp.&nbsp;
                          <span className="font-semibold text-txt-body">{visit.noExp || "—"}</span>
                          {visit.pkNum > 0 ? (
                            <span className="ml-1 font-sans font-normal"> · Familiar #{visit.pkNum}</span>
                          ) : (
                            <span className="ml-1 font-sans font-normal"> · Titular</span>
                          )}
                        </p>
                      </div>

                      {/* ── Detalles en grid de 2 columnas ─────────────── */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 border-t border-line-hairline">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-txt-muted">Hora registro</p>
                          <p className="text-sm font-bold font-mono text-txt-muted">
                            {visit.fechaAlta
                              ? new Date(visit.fechaAlta).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })
                              : "—"}
                          </p>
                          {visit.fechaAlta && (
                            <p className="text-[10px] font-mono text-txt-muted/60">
                              {new Date(visit.fechaAlta).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </p>
                          )}
                        </div>

                        {visit.horaConsulta ? (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-txt-muted">Hora cita</p>
                            <p className="text-sm font-bold font-mono text-primary">{visit.horaConsulta}</p>
                            {(visit.fechaConsulta ?? visit.fechaCita ?? visit.fechaAlta) && (
                              <p className="text-[10px] font-mono text-primary/60">
                                {(() => {
                                  const raw = visit.fechaConsulta ?? visit.fechaCita ?? visit.fechaAlta!;
                                  const d   = raw.includes("T") ? new Date(raw) : new Date(raw + "T00:00:00");
                                  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
                                })()}
                              </p>
                            )}
                          </div>
                        ) : null}

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-txt-muted">Servicio</p>
                          <div className="mt-0.5"><RecepcionServiceBadge service={visitService} /></div>
                        </div>

                        {visit.doctorNombre ? (
                          <div className="col-span-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-txt-muted">Médico</p>
                            <p className="text-xs font-semibold text-txt-body truncate">{visit.doctorNombre}</p>
                          </div>
                        ) : null}

                        {visit.consultorioNombre ? (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-txt-muted">Consultorio</p>
                            <p className="text-xs font-medium text-txt-body">{visit.consultorioNombre}</p>
                          </div>
                        ) : null}

                        {visit.centroNombre ? (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-txt-muted">Centro</p>
                            <p className="text-xs font-medium text-txt-body truncate">{visit.centroNombre}</p>
                          </div>
                        ) : null}

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-txt-muted">Llegada</p>
                          <p className="text-xs font-medium text-txt-body">{formatArrivalTypeLabel(visit.arrivalType)}</p>
                        </div>

                        {visit.notes ? (
                          <div className="col-span-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-txt-muted">Motivo</p>
                            <p className="text-xs text-txt-muted truncate">{visit.notes}</p>
                          </div>
                        ) : null}
                      </div>

                      <footer className="border-t border-line-hairline px-4 py-2">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            disabled={actionDisabled}
                            onClick={() => {
                              openStatusActionConfirmation(
                                visit.id,
                                visit.folio,
                                RECEPCION_ACTION.EN_SOMATOMETRIA,
                              );
                            }}
                          >
                            {
                              RECEPCION_ACTION_COPY[
                                RECEPCION_ACTION.EN_SOMATOMETRIA
                              ].label
                            }
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actionDisabled}
                            onClick={() => {
                              openStatusActionConfirmation(
                                visit.id,
                                visit.folio,
                                RECEPCION_ACTION.CANCELADA,
                              );
                            }}
                          >
                            {
                              RECEPCION_ACTION_COPY[RECEPCION_ACTION.CANCELADA]
                                .label
                            }
                          </Button>
                          {canMarkNoShow ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={actionDisabled}
                              onClick={() => {
                                openStatusActionConfirmation(
                                  visit.id,
                                  visit.folio,
                                  RECEPCION_ACTION.NO_SHOW,
                                );
                              }}
                            >
                              {
                                RECEPCION_ACTION_COPY[RECEPCION_ACTION.NO_SHOW]
                                  .label
                              }
                            </Button>
                          ) : null}
                        </div>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Paginación histórica ─────────────────────────────────── */}
          {bandejaIsHistorical && historicalData && historicalData.totalPages > 1 ? (
            <div className="flex items-center justify-between rounded-xl border border-line-struct bg-paper px-4 py-2">
              <p className="text-xs text-txt-muted">
                {historicalData.total} ficha(s) · página {bandejaPage} de {historicalData.totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={bandejaPage <= 1}
                  onClick={() => setBandejaPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={bandejaPage >= historicalData.totalPages}
                  onClick={() => setBandejaPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {view === "bandeja" &&
      canReadAgenda &&
      !(bandejaIsHistorical ? historicalLoading : queueQuery.isLoading) &&
      !(bandejaIsHistorical ? historicalIsError : queueQuery.isError) &&
      visits.length === 0 ? (
        <p className="text-sm text-txt-muted">
          {bandejaIsHistorical
            ? `Sin fichas para el período seleccionado (${bFechaDesde} → ${bFechaHasta}).`
            : "No hay visitas para mostrar en agenda."}
        </p>
      ) : null}

      {/* ── Historial NOM-024 ─────────────────────────────────────────── */}
      {view === "historial" ? (
        <div className="space-y-5">

          {/* ── Búsqueda ──────────────────────────────────────────────── */}
          <div className="rounded-xl border border-line-struct bg-paper px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="size-4 text-primary" />
                  <h2 className="text-base font-semibold text-txt-body">Historial de encuentros clínicos</h2>
                </div>
                <p className="text-xs text-txt-muted">NOM-024-SSA3-2012 · NOM-004-SSA3-2012 · Registro electrónico de salud</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0 font-mono">Sistema de información en salud</Badge>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px] space-y-1">
                <Label className="text-xs">Número de expediente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-txt-muted pointer-events-none" />
                  <Input placeholder="Ej. 12345 (mín. 4 caracteres)" value={histNoExp}
                    onChange={(e) => { setHistNoExp(e.target.value); setHistSelectedPkNum(null); }}
                    className="pl-9 h-9" />
                </div>
              </div>
              <div className="space-y-1 w-36">
                <Label className="text-xs">Desde</Label>
                <Input type="date" value={histFechaDesde} onChange={(e) => setHistFechaDesde(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1 w-36">
                <Label className="text-xs">Hasta <span className="font-normal text-txt-muted">(opc.)</span></Label>
                <Input type="date" value={histFechaHasta} min={histFechaDesde} onChange={(e) => setHistFechaHasta(e.target.value)} className="h-9" />
              </div>
            </div>
            {histDebouncedNoExp.trim().length > 0 && histDebouncedNoExp.trim().length < 4 ? (
              <p className="mt-2 text-xs text-txt-muted italic">Ingresa al menos 4 caracteres para buscar.</p>
            ) : null}
          </div>

          {/* ── Selector de miembro del núcleo familiar ─────────────── */}
          {histPatient && histEnabled ? (() => {
            const allMembers = [
              ...(histPatient.titular ? [histPatient.titular] : []),
              ...histPatient.dependientes,
            ];
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-txt-muted">
                    Núcleo familiar · Expediente <span className="font-mono text-txt-body">{histDebouncedNoExp.trim()}</span>
                  </p>
                  <p className="text-xs text-txt-muted">{allMembers.length} miembro(s)</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {allMembers.map((member) => {
                    const sel = histSelectedPkNum === member.pkNum;
                    return (
                      <button
                        key={member.pkNum}
                        type="button"
                        onClick={() => { setHistSelectedPkNum(member.pkNum); setHistTab("citas"); }}
                        className={[
                          "flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                          sel ? "border-primary bg-primary/5" : "border-line-struct hover:bg-subtle/40",
                        ].join(" ")}
                      >
                        <div className={[
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                          sel ? "border-primary bg-primary" : "border-line-struct",
                        ].join(" ")}>
                          {sel ? <span className="size-1.5 rounded-full bg-white" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-txt-body">{member.nombre}</p>
                          <p className="text-xs text-txt-muted">
                            {member.pkNum === 0 ? "Titular" : (member.parentesco ?? "Familiar")}
                            {member.edad != null ? ` · ${member.edad} años` : ""}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })() : null}

          {/* ── Contenido del miembro seleccionado ──────────────────── */}
          {histSelectedPkNum !== null && histEnabled ? (
            <div className="space-y-4">

              {/* Inner tabs */}
              <div className="flex items-center gap-1 rounded-xl border border-line-struct p-1 bg-subtle/20 w-fit">
                {(["citas", "visitas"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setHistTab(t)}
                    className={[
                      "rounded-lg px-4 py-1.5 text-xs font-medium transition-colors",
                      histTab === t ? "bg-paper text-txt-body shadow-sm" : "text-txt-muted hover:text-txt-body",
                    ].join(" ")}
                  >
                    {t === "citas"
                      ? `Citas agendadas (${histCitas.length})`
                      : `Visitas y movimientos (${histVisits.length})`}
                  </button>
                ))}
              </div>

              {/* ─ Tab: Citas ───────────────────────────────────────── */}
              {histTab === "citas" ? (
                histCitasLoading ? (
                  <div className="flex items-center gap-2 text-sm text-txt-muted py-4">
                    <Loader2 className="size-4 animate-spin" /> Cargando citas...
                  </div>
                ) : histCitas.length === 0 ? (
                  <div className="rounded-xl border border-line-struct bg-paper py-12 text-center">
                    <FileText className="size-10 text-txt-muted/30 mx-auto mb-3" />
                    <p className="text-sm text-txt-muted">Sin citas registradas para este paciente.</p>
                  </div>
                ) : (
                  <div className="relative pl-5 border-l-2 border-line-struct/60 space-y-4">
                    {histCitas.map((cita: CitaListItem) => {
                      const dot =
                        cita.estatus === ESTATUS_CITA.ATENDIDA   ? "bg-green-500" :
                        cita.estatus === ESTATUS_CITA.CANCELADA  ? "bg-red-400"   :
                        cita.estatus === ESTATUS_CITA.NO_ASISTIO ? "bg-amber-400" :
                        cita.estatus === ESTATUS_CITA.CONFIRMADA ? "bg-primary"   :
                                                                   "bg-txt-muted/40";
                      return (
                        <div key={cita.id} className="relative">
                          <div className={`absolute -left-[25px] top-4 size-3 rounded-full border-2 border-paper ${dot}`} />
                          <article className="rounded-xl border border-line-struct bg-paper overflow-hidden">
                            <div className="flex items-start justify-between gap-3 px-5 py-3 bg-subtle/20 border-b border-line-struct/50">
                              <div>
                                <p className="font-mono text-sm font-bold text-txt-body tracking-widest">{cita.folio}</p>
                                <p className="text-[10px] text-txt-muted mt-0.5">Identificador único de encuentro clínico</p>
                              </div>
                              <Badge variant={ESTATUS_VARIANT[cita.estatus]} className="text-xs shrink-0">
                                {ESTATUS_LABEL[cita.estatus]}
                              </Badge>
                            </div>
                            <div className="px-5 py-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Fecha y hora</p>
                                <p className="text-sm font-semibold text-txt-body">{formatCitaFechaHora(cita.fechaHora)}</p>
                                <p className="text-xs text-txt-muted">{cita.duracionMin} min</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Prestador del servicio</p>
                                <p className="text-sm font-semibold text-txt-body">{cita.medicoNombre}</p>
                                <p className="text-xs text-txt-muted capitalize">{cita.servicioTipo.replace("_", " ")}</p>
                              </div>
                              {cita.consultorioNombre ? (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Unidad de atención</p>
                                  <p className="text-sm font-semibold text-txt-body">{cita.consultorioNombre}</p>
                                </div>
                              ) : null}
                              {cita.motivo ? (
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Motivo de consulta</p>
                                  <p className="text-sm text-txt-body">{cita.motivo}</p>
                                </div>
                              ) : null}
                            </div>
                            <div className="px-5 py-2 border-t border-line-struct/40 bg-subtle/10 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[10px] text-txt-muted">
                                <span className="font-semibold">Registro:</span> {formatCitaFechaHora(cita.createdAt)}
                              </p>
                              <p className="text-[10px] font-mono text-txt-muted/70">Folio: {cita.folio}</p>
                            </div>
                          </article>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : null}

              {/* ─ Tab: Visitas y movimientos ──────────────────────── */}
              {histTab === "visitas" ? (
                histVisitsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-txt-muted py-4">
                    <Loader2 className="size-4 animate-spin" /> Cargando visitas...
                  </div>
                ) : histVisits.length === 0 ? (
                  <div className="rounded-xl border border-line-struct bg-paper py-12 text-center">
                    <FileText className="size-10 text-txt-muted/30 mx-auto mb-3" />
                    <p className="text-sm text-txt-muted">Sin visitas registradas para este paciente.</p>
                    <p className="text-xs text-txt-muted/70 mt-1">Las visitas se generan en el módulo de check-in.</p>
                  </div>
                ) : (
                  <div className="relative pl-5 border-l-2 border-line-struct/60 space-y-4">
                    {histVisits.map((visit) => (
                      <div key={visit.id} className="relative">
                        <div className={[
                          "absolute -left-[25px] top-4 size-3 rounded-full border-2 border-paper",
                          visit.status === "cerrada"  ? "bg-green-500" :
                          visit.status === "cancelada" || visit.status === "no_show" ? "bg-red-400" :
                          visit.status === "en_consulta" ? "bg-blue-500" :
                          "bg-txt-muted/40",
                        ].join(" ")} />
                        <HistVisitCard visit={visit} />
                      </div>
                    ))}
                  </div>
                )
              ) : null}

            </div>
          ) : histEnabled && !histPatient ? (
            <div className="rounded-xl border border-line-struct bg-paper py-12 text-center">
              <p className="text-sm text-txt-muted">Expediente no encontrado en el sistema.</p>
            </div>
          ) : null}

        </div>
      ) : null}

      <AlertDialog
        open={pendingStatusAction !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPendingStatusAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar accion de recepcion</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusAction && pendingActionCopy
                ? pendingActionCopy.getDescription(pendingStatusAction.folio)
                : "Confirma la accion seleccionada para continuar."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="whitespace-nowrap"
              disabled={visitStatusAction.isPending}
              onClick={() => {
                void handleConfirmStatusAction();
              }}
            >
              {pendingActionCopy?.confirmLabel ?? "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecepcionQuickCheckinDialog
        open={quickCheckinOpen}
        onOpenChange={(nextOpen) => {
          setQuickCheckinOpen(nextOpen);
          if (!nextOpen) setQuickCheckinDefaults(undefined);
        }}
        canWrite={canWriteRecepcion}
        initialValues={resolvedQuickCheckinDefaults}
        activeVisits={visits}
      />

      <FichaModal
        open={fichaOpen}
        onOpenChange={setFichaOpen}
        visit={fichaVisit}
      />
    </section>
  );
};

export default RecepcionAgendaPage;
