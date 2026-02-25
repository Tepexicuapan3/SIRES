import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  ClipboardCheck,
  RefreshCcw,
  UserRoundSearch,
  UsersRound,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ARRIVAL_TYPE,
  VISIT_STATUS,
  type VisitQueueItem,
  type VisitStatus,
} from "@api/types";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
import { RecepcionQuickCheckinDialog } from "@features/recepcion/modules/agenda/components/RecepcionQuickCheckinDialog";
import { useRecepcionAgendaQueue } from "@features/recepcion/modules/agenda/queries/useRecepcionAgendaQueue";
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

const STATUS_PRIORITY: Record<VisitStatus, number> = {
  [VISIT_STATUS.EN_ESPERA]: 0,
  [VISIT_STATUS.EN_SOMATOMETRIA]: 1,
  [VISIT_STATUS.LISTA_PARA_DOCTOR]: 2,
  [VISIT_STATUS.EN_CONSULTA]: 3,
  [VISIT_STATUS.CERRADA]: 4,
  [VISIT_STATUS.CANCELADA]: 5,
  [VISIT_STATUS.NO_SHOW]: 6,
};

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
  const statusDifference =
    STATUS_PRIORITY[firstVisit.status] - STATUS_PRIORITY[secondVisit.status];

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return firstVisit.folio.localeCompare(secondVisit.folio, "es");
};

export const RecepcionAgendaPage = () => {
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
  const [quickCheckinOpen, setQuickCheckinOpen] = useState(false);

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

  const serviceCounts = visits.reduce<Record<RecepcionService, number>>(
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

  const filteredVisits = visits
    .filter((visit) => matchesStatus(visit, statusFilter))
    .filter((visit) => matchesArrivalType(visit, arrivalTypeFilter))
    .filter((visit) => matchesSearch(visit, searchTerm))
    .filter((visit) => {
      const service = resolveRecepcionService(visit);
      return matchesService(service, serviceFilter);
    })
    .sort(sortAgendaVisits);

  return (
    <section className="space-y-6 p-6">
      <header className="flex flex-col gap-3 rounded-xl border border-line-struct bg-paper p-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-line-hairline bg-subtle px-3 py-1 text-xs font-medium text-txt-muted">
            <CalendarClock className="size-3.5" />
            Centro de recepcion
          </div>
          <h1 className="text-2xl font-semibold text-txt-body">
            Agenda operativa
          </h1>
          <p className="max-w-2xl text-sm text-txt-muted">
            Visualiza estado por servicio y ejecuta check-in rapido sin perder
            contexto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            Sync: {queueQuery.connectionStatus ?? "idle"}
          </Badge>
          <Button
            type="button"
            variant="outline"
            disabled={!canWriteRecepcion}
            onClick={() => setQuickCheckinOpen(true)}
          >
            Check-in rapido
          </Button>
          <Button asChild>
            <Link to="/recepcion/checkin">Ir a check-in</Link>
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
      visits.length === 0 ? (
        <p className="text-sm text-txt-muted">
          No hay visitas para mostrar en agenda.
        </p>
      ) : null}

      {canReadAgenda &&
      !queueQuery.isLoading &&
      !queueQuery.isError &&
      visits.length > 0 ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="gap-0 py-0">
              <CardHeader className="gap-1 border-b py-4">
                <CardTitle className="flex items-center gap-2 text-sm text-txt-muted">
                  <UsersRound className="size-4" />
                  Visitas abiertas
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <p className="text-2xl font-semibold text-txt-body">
                  {openVisits.length}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 py-0">
              <CardHeader className="gap-1 border-b py-4">
                <CardTitle className="flex items-center gap-2 text-sm text-txt-muted">
                  <ClipboardCheck className="size-4" />
                  En espera
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <p className="text-2xl font-semibold text-txt-body">
                  {waitingCount}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 py-0">
              <CardHeader className="gap-1 border-b py-4">
                <CardTitle className="text-sm text-txt-muted">
                  Con cita
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <p className="text-2xl font-semibold text-txt-body">
                  {withAppointmentCount}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 py-0">
              <CardHeader className="gap-1 border-b py-4">
                <CardTitle className="text-sm text-txt-muted">
                  Sin cita
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <p className="text-2xl font-semibold text-txt-body">
                  {walkInCount}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {RECEPCION_SERVICE_LIST.map((service) => (
              <Card key={service} className="gap-0 py-0">
                <CardHeader className="gap-1 border-b py-4">
                  <CardTitle className="text-sm text-txt-muted">
                    {RECEPCION_SERVICE_PROFILES[service].label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <p className="text-2xl font-semibold text-txt-body">
                    {serviceCounts[service]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="space-y-4 rounded-xl border border-line-struct bg-paper p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
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
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredVisits.map((visit) => {
                  const visitService = resolveRecepcionService(visit);

                  return (
                    <article
                      key={visit.id}
                      className="flex flex-col gap-4 rounded-xl border border-line-struct bg-paper p-4 shadow-soft"
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
                          <dd>
                            <Badge variant="secondary">
                              {formatArrivalTypeLabel(visit.arrivalType)}
                            </Badge>
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-txt-muted">Cita</dt>
                          <dd className="font-medium text-txt-body">
                            {visit.appointmentId ?? "Sin cita registrada"}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-txt-muted">Doctor</dt>
                          <dd className="font-medium text-txt-body">
                            {visit.doctorId ?? "Por asignar"}
                          </dd>
                        </div>
                      </dl>

                      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line-hairline pt-3">
                        <span className="text-xs text-txt-muted">
                          {formatVisitStatusLabel(visit.status)}
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            to={`/recepcion/checkin?folio=${encodeURIComponent(visit.folio)}`}
                          >
                            Abrir check-in
                          </Link>
                        </Button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}

      <section className="rounded-xl border border-line-struct bg-subtle p-4">
        <p
          className="flex items-start gap-2 text-sm text-txt-muted"
          role="status"
        >
          <UserRoundSearch className="mt-0.5 size-4 shrink-0" />
          Tip operativo: filtra por servicio en hora pico y usa check-in rapido
          para ingresos nuevos.
        </p>
      </section>

      <RecepcionQuickCheckinDialog
        open={quickCheckinOpen}
        onOpenChange={setQuickCheckinOpen}
        canWrite={canWriteRecepcion}
      />

      {canReadAgenda && !queueQuery.isLoading ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            onClick={() => {
              void queueQuery.refetch?.();
            }}
          >
            <RefreshCcw className="size-4" />
            Actualizar agenda
          </Button>
        </div>
      ) : null}
    </section>
  );
};

export default RecepcionAgendaPage;
