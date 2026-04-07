import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CalendarClock, RefreshCcw } from "lucide-react";
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
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  ARRIVAL_TYPE,
  RECEPCION_STATUS_ACTION,
  VISIT_STATUS,
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
  formatVisitStatusLabel,
  isOpenVisitStatus,
} from "@features/recepcion/shared/utils/recepcion-format";

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

  const patientId = String(visit.patientId).toLowerCase();
  const folio = visit.folio.toLowerCase();
  const appointmentId = (visit.appointmentId ?? "").toLowerCase();

  return (
    folio.includes(normalizedSearch) ||
    patientId.includes(normalizedSearch) ||
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
  const [quickCheckinOpen, setQuickCheckinOpen] = useState(
    () => shouldFocusCheckin,
  );
  const [quickCheckinDefaults, setQuickCheckinDefaults] = useState<
    Partial<CheckinFormInput> | undefined
  >(undefined);
  const [pendingStatusAction, setPendingStatusAction] =
    useState<PendingStatusAction | null>(null);

  const visits = queueQuery.data?.items ?? [];
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

  const filteredVisits = visits
    .filter((visit) => matchesStatus(visit, statusFilter))
    .filter((visit) => matchesArrivalType(visit, arrivalTypeFilter))
    .filter((visit) => matchesSearch(visit, searchTerm))
    .filter((visit) => {
      const service = resolveRecepcionService(visit);
      return matchesService(service, serviceFilter);
    })
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
          <span className="rounded-full border border-line-hairline bg-subtle px-3 py-1 text-xs font-medium text-txt-muted">
            Sync: {queueQuery.connectionStatus ?? "idle"}
          </span>
          <Button
            type="button"
            onClick={() => handleOpenQuickCheckin()}
            disabled={!canWriteRecepcion}
          >
            Generar ficha de consulta
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            onClick={() => {
              void queueQuery.refetch?.();
            }}
          >
            <RefreshCcw className="size-4" />
            Actualizar
          </Button>
        </div>
      </header>

      {!canReadAgenda ? (
        <p className="text-sm text-txt-muted" role="status">
          No tenes permisos completos para cargar la agenda operativa de
          recepcion.
        </p>
      ) : null}

      {canReadAgenda && queueQuery.isLoading ? (
        <p className="text-sm text-txt-muted">
          Cargando agenda de recepcion...
        </p>
      ) : null}

      {canReadAgenda && queueQuery.isError ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>
            No se pudo cargar la agenda operativa de recepcion.
          </AlertDescription>
        </Alert>
      ) : null}

      {canReadAgenda &&
      !queueQuery.isLoading &&
      !queueQuery.isError &&
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
                      className="flex flex-col gap-3 rounded-xl border border-line-struct bg-paper p-4"
                    >
                      <header className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-txt-muted">
                            Folio
                          </p>
                          <p className="text-lg font-semibold text-txt-body">
                            {visit.folio}
                          </p>
                        </div>
                        <RecepcionStatusBadge status={visit.status} />
                      </header>

                      <dl className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-txt-muted">Paciente</dt>
                          <dd className="font-medium text-txt-body">
                            {visit.patientId}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-txt-muted">Servicio</dt>
                          <dd>
                            <RecepcionServiceBadge service={visitService} />
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-txt-muted">Tipo</dt>
                          <dd>{formatArrivalTypeLabel(visit.arrivalType)}</dd>
                        </div>
                      </dl>

                      <footer className="mt-auto space-y-2 border-t border-line-hairline pt-3">
                        <span className="text-xs text-txt-muted">
                          {formatVisitStatusLabel(visit.status)}
                        </span>
                        <div className="flex flex-wrap items-center justify-end gap-2">
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
        </>
      ) : null}

      {canReadAgenda &&
      !queueQuery.isLoading &&
      !queueQuery.isError &&
      visits.length === 0 ? (
        <p className="text-sm text-txt-muted">
          No hay visitas para mostrar en agenda.
        </p>
      ) : null}

      <AlertDialog
        open={pendingStatusAction !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPendingStatusAction(null);
          }
        }}
      >
        <AlertDialogContent size="sm">
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

          if (!nextOpen) {
            setQuickCheckinDefaults(undefined);
          }
        }}
        canWrite={canWriteRecepcion}
        initialValues={resolvedQuickCheckinDefaults}
      />
    </section>
  );
};

export default RecepcionAgendaPage;
