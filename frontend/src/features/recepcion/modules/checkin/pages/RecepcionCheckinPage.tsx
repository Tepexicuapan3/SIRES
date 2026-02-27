import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError } from "@api/utils/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ARRIVAL_TYPE,
  RECEPCION_STATUS_ACTION,
  VISIT_STATUS,
} from "@api/types";
import { VisitStageNavigator } from "@features/flujo-clinico/components/VisitStageNavigator";
import {
  VISIT_STAGE,
  canRunRecepcionStatusAction,
} from "@features/flujo-clinico/domain/visit-flow.constants";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
import { useCreateVisit } from "@features/flujo-clinico/mutations/useCreateVisit";
import { useVisitStatusAction } from "@features/flujo-clinico/mutations/useVisitStatusAction";
import { useRecepcionQueue } from "@features/flujo-clinico/queries/useRecepcionQueue";
import {
  createCheckinFormSchema,
  DEFAULT_CHECKIN_FORM_VALUES,
  type CheckinFormInput,
  type CheckinFormValues,
} from "@features/recepcion/modules/checkin/domain/checkin.schemas";
import { mapCheckinFormToCreateVisitRequest } from "@features/recepcion/modules/checkin/domain/checkin.mappers";
import {
  RECEPCION_QUEUE_PERMISSION_REQUIREMENT,
  RECEPCION_WRITE_PERMISSION_REQUIREMENT,
} from "@features/recepcion/shared/domain/recepcion.permissions";
import {
  RECEPCION_SERVICE,
  RECEPCION_SERVICE_LIST,
  RECEPCION_SERVICE_PROFILES,
  isServiceForcedToWalkIn,
  resolveRecepcionService,
} from "@features/recepcion/shared/domain/recepcion.services";
import { RecepcionServiceBadge } from "@features/recepcion/shared/components/RecepcionServiceBadge";
import { RecepcionStatusBadge } from "@features/recepcion/shared/components/RecepcionStatusBadge";
import { formatArrivalTypeLabel } from "@features/recepcion/shared/utils/recepcion-format";

const SORT_OPTION = {
  FOLIO_ASC: "folio_asc",
  FOLIO_DESC: "folio_desc",
  PATIENT_ASC: "patient_asc",
  PATIENT_DESC: "patient_desc",
} as const;

type SortOption = (typeof SORT_OPTION)[keyof typeof SORT_OPTION];

const ARRIVAL_TYPE_FILTER_OPTION = {
  ALL: "all",
  APPOINTMENT: ARRIVAL_TYPE.APPOINTMENT,
  WALK_IN: ARRIVAL_TYPE.WALK_IN,
} as const;

type ArrivalTypeFilterOption =
  (typeof ARRIVAL_TYPE_FILTER_OPTION)[keyof typeof ARRIVAL_TYPE_FILTER_OPTION];

const SERVICE_FILTER_OPTION = {
  ALL: "all",
  MEDICINA_GENERAL: RECEPCION_SERVICE.MEDICINA_GENERAL,
  ESPECIALIDAD: RECEPCION_SERVICE.ESPECIALIDAD,
  URGENCIAS: RECEPCION_SERVICE.URGENCIAS,
} as const;

type ServiceFilterOption =
  (typeof SERVICE_FILTER_OPTION)[keyof typeof SERVICE_FILTER_OPTION];

const RECEPCION_ACTION = {
  CANCELADA: RECEPCION_STATUS_ACTION.CANCELADA,
  NO_SHOW: RECEPCION_STATUS_ACTION.NO_SHOW,
} as const;

type RecepcionAction = (typeof RECEPCION_ACTION)[keyof typeof RECEPCION_ACTION];

const RECEPCION_ACTION_COPY: Record<
  RecepcionAction,
  {
    confirmLabel: string;
    successMessage: string;
    getDescription: (folio: string) => string;
  }
> = {
  [RECEPCION_ACTION.CANCELADA]: {
    confirmLabel: "Confirmar cancelacion",
    successMessage: "Visita marcada como cancelada.",
    getDescription: (folio) =>
      `Vas a marcar la visita ${folio} como cancelada. Esta accion no se puede deshacer.`,
  },
  [RECEPCION_ACTION.NO_SHOW]: {
    confirmLabel: "Confirmar no show",
    successMessage: "Visita marcada como no show.",
    getDescription: (folio) =>
      `Vas a marcar la visita ${folio} como no show. Esta accion no se puede deshacer.`,
  },
};

const CREATE_VISIT_DOMAIN_ERROR_MESSAGE: Record<
  | "VISIT_DUPLICATE_SUBMIT"
  | "ROLE_NOT_ALLOWED"
  | "VALIDATION_ERROR"
  | "PERMISSION_DENIED",
  string
> = {
  VISIT_DUPLICATE_SUBMIT: "Ya existe una visita abierta para este paciente.",
  ROLE_NOT_ALLOWED: "No tenes permiso para registrar llegadas en recepcion.",
  VALIDATION_ERROR: "Revisa los datos de llegada antes de continuar.",
  PERMISSION_DENIED: "No tenes permiso para ejecutar esta accion.",
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

const FALLBACK_CREATE_VISIT_ERROR_MESSAGE =
  "No se pudo registrar la llegada. Intenta nuevamente.";

const FALLBACK_VISIT_STATUS_ERROR_MESSAGE =
  "No se pudo actualizar el estado de la visita. Intenta nuevamente.";

const RETRYABLE_STATUS_ACTION_ERRORS = [
  "VISIT_STATE_INVALID",
  "VISIT_NOT_FOUND",
] as const;

interface FeedbackState {
  kind: "success" | "error";
  message: string;
}

interface PendingStatusAction {
  visitId: number;
  folio: string;
  targetStatus: RecepcionAction;
}

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

const sortVisits = (
  sortOption: SortOption,
  firstVisit: { folio: string; patientId: number },
  secondVisit: { folio: string; patientId: number },
): number => {
  switch (sortOption) {
    case SORT_OPTION.FOLIO_DESC:
      return secondVisit.folio.localeCompare(firstVisit.folio, "es");
    case SORT_OPTION.PATIENT_ASC:
      return firstVisit.patientId - secondVisit.patientId;
    case SORT_OPTION.PATIENT_DESC:
      return secondVisit.patientId - firstVisit.patientId;
    case SORT_OPTION.FOLIO_ASC:
    default:
      return firstVisit.folio.localeCompare(secondVisit.folio, "es");
  }
};

const shouldRefreshQueueAfterError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) {
    return false;
  }

  return RETRYABLE_STATUS_ACTION_ERRORS.includes(
    error.code as (typeof RETRYABLE_STATUS_ACTION_ERRORS)[number],
  );
};

export const RecepcionCheckinPage = () => {
  const [searchParams] = useSearchParams();
  const { hasCapability } = usePermissionDependencies();
  const canReadRecepcionQueue = hasCapability(
    "flow.visits.queue.read",
    RECEPCION_QUEUE_PERMISSION_REQUIREMENT,
  );
  const canWriteRecepcion = hasCapability(
    "flow.recepcion.queue.write",
    RECEPCION_WRITE_PERMISSION_REQUIREMENT,
  );

  const queueQuery = useRecepcionQueue({ enabled: canReadRecepcionQueue });
  const createVisit = useCreateVisit();
  const visitStatusAction = useVisitStatusAction();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get("folio") ?? searchParams.get("patientId") ?? "";
  });
  const [arrivalTypeFilter, setArrivalTypeFilter] =
    useState<ArrivalTypeFilterOption>(ARRIVAL_TYPE_FILTER_OPTION.ALL);
  const [serviceFilter, setServiceFilter] = useState<ServiceFilterOption>(
    SERVICE_FILTER_OPTION.ALL,
  );
  const [sortOption, setSortOption] = useState<SortOption>(
    SORT_OPTION.FOLIO_ASC,
  );
  const [pendingStatusAction, setPendingStatusAction] =
    useState<PendingStatusAction | null>(null);

  const form = useForm<CheckinFormInput, unknown, CheckinFormValues>({
    resolver: zodResolver(createCheckinFormSchema),
    defaultValues: DEFAULT_CHECKIN_FORM_VALUES,
  });

  const [serviceType, arrivalType] = useWatch({
    control: form.control,
    name: ["serviceType", "arrivalType"],
  });
  const isWalkInOnlyService = isServiceForcedToWalkIn(serviceType);
  const serviceTypeField = form.register("serviceType");
  const arrivalTypeField = form.register("arrivalType");

  const visits = queueQuery.data?.items ?? [];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredVisits = visits.filter((visit) => {
    const visitService = resolveRecepcionService(visit);
    const matchesService =
      serviceFilter === SERVICE_FILTER_OPTION.ALL ||
      visitService === serviceFilter;
    const matchesArrivalType =
      arrivalTypeFilter === ARRIVAL_TYPE_FILTER_OPTION.ALL ||
      visit.arrivalType === arrivalTypeFilter;

    if (!normalizedSearchTerm) {
      return matchesService && matchesArrivalType;
    }

    const patientIdAsText = String(visit.patientId);
    const folio = visit.folio.toLowerCase();

    return (
      matchesService &&
      matchesArrivalType &&
      (folio.includes(normalizedSearchTerm) ||
        patientIdAsText.includes(normalizedSearchTerm))
    );
  });

  const sortedVisits = [...filteredVisits].sort((firstVisit, secondVisit) => {
    return sortVisits(sortOption, firstVisit, secondVisit);
  });

  const currentStatus = sortedVisits[0]?.status ?? VISIT_STATUS.EN_ESPERA;
  const pendingActionCopy = pendingStatusAction
    ? RECEPCION_ACTION_COPY[pendingStatusAction.targetStatus]
    : null;

  const handleCreateVisit = async (values: CheckinFormValues) => {
    if (!canWriteRecepcion) {
      return;
    }

    setFeedback(null);

    try {
      await createVisit.mutateAsync(mapCheckinFormToCreateVisitRequest(values));
      setFeedback({
        kind: "success",
        message: "Llegada registrada correctamente.",
      });
      form.reset(DEFAULT_CHECKIN_FORM_VALUES);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: resolveDomainErrorMessage(
          error,
          CREATE_VISIT_DOMAIN_ERROR_MESSAGE,
          FALLBACK_CREATE_VISIT_ERROR_MESSAGE,
        ),
      });
    }
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

    setFeedback(null);

    try {
      await visitStatusAction.mutateAsync({
        visitId: pendingStatusAction.visitId,
        targetStatus: pendingStatusAction.targetStatus,
      });
      setFeedback({
        kind: "success",
        message:
          RECEPCION_ACTION_COPY[pendingStatusAction.targetStatus]
            .successMessage,
      });
    } catch (error) {
      if (shouldRefreshQueueAfterError(error)) {
        void queueQuery.refetch?.();
      }

      setFeedback({
        kind: "error",
        message: resolveDomainErrorMessage(
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
    <section className="space-y-6 p-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-txt-body">
              Check-in y registro de llegada
            </h1>
            <p className="text-sm text-txt-muted">
              Registra llegadas por servicio y gestiona acciones operativas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-line-hairline bg-subtle px-2 py-1 text-xs text-txt-muted">
              Sync: {queueQuery.connectionStatus ?? "idle"}
            </span>
            <Button variant="outline" asChild>
              <Link to="/recepcion/agenda">Ver agenda</Link>
            </Button>
          </div>
        </div>
        <VisitStageNavigator
          currentStatus={currentStatus}
          currentStage={VISIT_STAGE.RECEPCION}
        />
      </header>

      {!canReadRecepcionQueue ? (
        <p className="text-sm text-txt-muted" role="status">
          No tenes permisos completos para cargar la bandeja de recepcion.
        </p>
      ) : null}

      {canReadRecepcionQueue && queueQuery.isLoading ? (
        <p className="text-sm text-txt-muted">Cargando cola de recepcion...</p>
      ) : null}

      {canReadRecepcionQueue && queueQuery.isError ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>
            No se pudo cargar la cola de recepcion.
          </AlertDescription>
        </Alert>
      ) : null}

      {canReadRecepcionQueue &&
      !queueQuery.isLoading &&
      !queueQuery.isError &&
      visits.length === 0 ? (
        <p className="text-sm text-txt-muted">No hay pacientes en recepcion.</p>
      ) : null}

      {canReadRecepcionQueue &&
      !queueQuery.isLoading &&
      !queueQuery.isError &&
      visits.length > 0 ? (
        <section className="space-y-4 rounded-xl border border-line-struct bg-paper p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="queue-search">Buscar paciente o folio</Label>
              <Input
                id="queue-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Ej. VST-001 o 1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue-arrival-filter">
                Filtrar por tipo de llegada
              </Label>
              <select
                id="queue-arrival-filter"
                className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                value={arrivalTypeFilter}
                onChange={(event) => {
                  setArrivalTypeFilter(
                    event.target.value as ArrivalTypeFilterOption,
                  );
                }}
              >
                <option value={ARRIVAL_TYPE_FILTER_OPTION.ALL}>Todos</option>
                <option value={ARRIVAL_TYPE_FILTER_OPTION.APPOINTMENT}>
                  Con cita
                </option>
                <option value={ARRIVAL_TYPE_FILTER_OPTION.WALK_IN}>
                  Sin cita
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue-service-filter">Filtrar por servicio</Label>
              <select
                id="queue-service-filter"
                className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                value={serviceFilter}
                onChange={(event) => {
                  setServiceFilter(event.target.value as ServiceFilterOption);
                }}
              >
                <option value={SERVICE_FILTER_OPTION.ALL}>Todos</option>
                {RECEPCION_SERVICE_LIST.map((service) => (
                  <option key={service} value={service}>
                    {RECEPCION_SERVICE_PROFILES[service].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue-sort">Ordenar por</Label>
              <select
                id="queue-sort"
                className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                value={sortOption}
                onChange={(event) => {
                  setSortOption(event.target.value as SortOption);
                }}
              >
                <option value={SORT_OPTION.FOLIO_ASC}>Folio (A-Z)</option>
                <option value={SORT_OPTION.FOLIO_DESC}>Folio (Z-A)</option>
                <option value={SORT_OPTION.PATIENT_ASC}>
                  Paciente (menor a mayor)
                </option>
                <option value={SORT_OPTION.PATIENT_DESC}>
                  Paciente (mayor a menor)
                </option>
              </select>
            </div>
          </div>

          {sortedVisits.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-line-struct">
              <table
                aria-label="Cola de recepcion"
                className="min-w-full divide-y divide-line-struct text-sm"
              >
                <thead className="bg-subtle">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Folio</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Paciente
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Servicio
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-left font-medium">Estado</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-struct">
                  {sortedVisits.map((visit) => {
                    const canRunAction = canRunRecepcionStatusAction(
                      visit.status,
                    );
                    const visitService = resolveRecepcionService(visit);

                    return (
                      <tr key={visit.id}>
                        <td className="px-3 py-2 font-medium">{visit.folio}</td>
                        <td className="px-3 py-2">{visit.patientId}</td>
                        <td className="px-3 py-2">
                          <RecepcionServiceBadge service={visitService} />
                        </td>
                        <td className="px-3 py-2">
                          {formatArrivalTypeLabel(visit.arrivalType)}
                        </td>
                        <td className="px-3 py-2">
                          <RecepcionStatusBadge status={visit.status} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                !canRunAction ||
                                !canWriteRecepcion ||
                                visitStatusAction.isPending
                              }
                              onClick={() => {
                                openStatusActionConfirmation(
                                  visit.id,
                                  visit.folio,
                                  RECEPCION_ACTION.CANCELADA,
                                );
                              }}
                            >
                              Cancelar visita
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                !canRunAction ||
                                !canWriteRecepcion ||
                                visitStatusAction.isPending
                              }
                              onClick={() => {
                                openStatusActionConfirmation(
                                  visit.id,
                                  visit.folio,
                                  RECEPCION_ACTION.NO_SHOW,
                                );
                              }}
                            >
                              Marcar no show
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-txt-muted">
              No hay resultados para los filtros aplicados.
            </p>
          )}
        </section>
      ) : null}

      <section className="space-y-4 rounded-xl border border-line-struct bg-paper p-4">
        <h2 className="text-lg font-semibold text-txt-body">
          Registro de llegada
        </h2>

        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(handleCreateVisit)}
        >
          <div className="space-y-2">
            <Label htmlFor="serviceType">Servicio de atencion</Label>
            <select
              id="serviceType"
              className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              disabled={!canWriteRecepcion || createVisit.isPending}
              {...serviceTypeField}
              onChange={(event) => {
                serviceTypeField.onChange(event);
                const nextService = event.target
                  .value as CheckinFormValues["serviceType"];

                if (isServiceForcedToWalkIn(nextService)) {
                  form.setValue("arrivalType", ARRIVAL_TYPE.WALK_IN, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue("appointmentId", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            >
              {RECEPCION_SERVICE_LIST.map((service) => (
                <option key={service} value={service}>
                  {RECEPCION_SERVICE_PROFILES[service].label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientId">ID paciente</Label>
            <Input
              id="patientId"
              type="number"
              disabled={!canWriteRecepcion || createVisit.isPending}
              {...form.register("patientId")}
            />
            {form.formState.errors.patientId?.message ? (
              <p className="text-sm text-status-critical" role="alert">
                {form.formState.errors.patientId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="arrivalType">Tipo de llegada</Label>
            <select
              id="arrivalType"
              className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              disabled={
                !canWriteRecepcion ||
                createVisit.isPending ||
                isWalkInOnlyService
              }
              {...arrivalTypeField}
            >
              <option value={ARRIVAL_TYPE.APPOINTMENT}>Con cita</option>
              <option value={ARRIVAL_TYPE.WALK_IN}>Sin cita</option>
            </select>
            {form.formState.errors.arrivalType?.message ? (
              <p className="text-sm text-status-critical" role="alert">
                {form.formState.errors.arrivalType.message}
              </p>
            ) : null}
          </div>

          {arrivalType === ARRIVAL_TYPE.APPOINTMENT ? (
            <div className="space-y-2">
              <Label htmlFor="appointmentId">ID de cita</Label>
              <Input
                id="appointmentId"
                disabled={!canWriteRecepcion || createVisit.isPending}
                {...form.register("appointmentId")}
              />
              {form.formState.errors.appointmentId?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.appointmentId.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="doctorId">ID doctor (opcional)</Label>
            <Input
              id="doctorId"
              type="number"
              disabled={!canWriteRecepcion || createVisit.isPending}
              {...form.register("doctorId")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              rows={3}
              disabled={!canWriteRecepcion || createVisit.isPending}
              {...form.register("notes")}
            />
          </div>

          <Button
            type="submit"
            disabled={!canWriteRecepcion || createVisit.isPending}
          >
            Registrar llegada
          </Button>
        </form>

        {canReadRecepcionQueue && !canWriteRecepcion ? (
          <p className="text-sm text-txt-muted" role="status">
            No tenes permisos completos para registrar llegadas o actualizar
            estados.
          </p>
        ) : null}

        {feedback ? (
          <Alert variant={feedback.kind === "error" ? "warning" : "success"}>
            <AlertTitle>
              {feedback.kind === "error" ? "No se pudo completar" : "Listo"}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        ) : null}
      </section>

      <AlertDialog
        open={pendingStatusAction !== null}
        onOpenChange={(open) => {
          if (!open) {
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

      <section className="rounded-xl border border-line-struct bg-subtle p-4">
        <p className="text-sm text-txt-muted" role="status">
          Tip operativo: agenda para priorizar y check-in para ejecutar.
        </p>
      </section>
    </section>
  );
};

export default RecepcionCheckinPage;
