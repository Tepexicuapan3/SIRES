import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { VISIT_SERVICE, VISIT_STATUS, type VisitQueueItem, type VisitStatus } from "@api/types";
import { useDoctorPipelineQueue } from "@features/consulta-medica/modules/atencion/queries/useDoctorPipelineQueue";

/** Duplicado deliberado y minimo de labels de estado/servicio -- mismo
 * criterio que ya se documenta en `SomatometriaQueueCards.tsx`/
 * `TodayCaptureBanner.tsx`: `consulta-medica` no importa componentes de
 * `recepcion/shared` (features sin acoplar entre si en este codebase). */
const PIPELINE_STATUS_LABEL: Record<VisitStatus, string> = {
  [VISIT_STATUS.EN_ESPERA]: "En espera (recepción)",
  [VISIT_STATUS.EN_SOMATOMETRIA]: "En somatometría",
  [VISIT_STATUS.LISTA_PARA_DOCTOR]: "Listo para consulta",
  [VISIT_STATUS.EN_CONSULTA]: "En consulta",
  [VISIT_STATUS.CERRADA]: "Cerrada",
  [VISIT_STATUS.CANCELADA]: "Cancelada",
  [VISIT_STATUS.NO_SHOW]: "No se presentó",
};

const PIPELINE_STATUS_VARIANT: Record<
  VisitStatus,
  "alert" | "info" | "secondary" | "stable" | "critical"
> = {
  [VISIT_STATUS.EN_ESPERA]: "alert",
  [VISIT_STATUS.EN_SOMATOMETRIA]: "info",
  [VISIT_STATUS.LISTA_PARA_DOCTOR]: "secondary",
  [VISIT_STATUS.EN_CONSULTA]: "secondary",
  [VISIT_STATUS.CERRADA]: "stable",
  [VISIT_STATUS.CANCELADA]: "critical",
  [VISIT_STATUS.NO_SHOW]: "critical",
};

const PIPELINE_SERVICE_LABEL: Record<string, string> = {
  [VISIT_SERVICE.MEDICINA_GENERAL]: "Medicina general",
  [VISIT_SERVICE.ESPECIALIDAD]: "Especialidad",
  [VISIT_SERVICE.URGENCIAS]: "Urgencias",
};

const formatServiceLabel = (serviceType: string): string =>
  PIPELINE_SERVICE_LABEL[serviceType] ?? serviceType;

const formatFechaHora = (iso: string): string =>
  new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/** Fecha/hora relevante segun la etapa de la visita -- cada estado tiene un
 * timestamp distinto que tiene sentido mostrar (cuando llego a recepcion,
 * cuando entro a somatometria, etc.). */
const resolvePipelineTimestamp = (
  visit: VisitQueueItem,
): { label: string; value: string } | null => {
  if (visit.status === VISIT_STATUS.EN_ESPERA) {
    return visit.fechaAlta
      ? { label: "Llegó a recepción", value: formatFechaHora(visit.fechaAlta) }
      : null;
  }

  if (visit.status === VISIT_STATUS.EN_SOMATOMETRIA) {
    return visit.enSomatometriaAt
      ? { label: "En somatometría desde", value: formatFechaHora(visit.enSomatometriaAt) }
      : null;
  }

  if (visit.vitals?.capturedAt) {
    return {
      label: "Signos vitales capturados",
      value: formatFechaHora(visit.vitals.capturedAt),
    };
  }

  return null;
};

interface PipelineCardProps {
  visit: VisitQueueItem;
}

function PipelineCard({ visit }: PipelineCardProps) {
  const timestamp = resolvePipelineTimestamp(visit);

  return (
    <article
      data-testid={`doctor-pipeline-card-${visit.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-line-struct bg-paper"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line-hairline bg-subtle/30 px-4 py-2">
        <span className="font-mono text-xs text-txt-muted">{visit.folio}</span>
        <Badge variant={PIPELINE_STATUS_VARIANT[visit.status]}>
          {PIPELINE_STATUS_LABEL[visit.status]}
        </Badge>
      </div>

      <div className="px-4 py-3">
        {visit.nombrePaciente ? (
          <p className="truncate text-sm font-bold text-txt-body">
            {visit.nombrePaciente}
          </p>
        ) : (
          <p className="text-sm font-medium text-txt-muted">
            Sin nombre registrado
          </p>
        )}
        <p className="mt-0.5 font-mono text-xs text-txt-muted">
          Exp.&nbsp;
          <span className="font-semibold text-txt-body">
            {visit.noExp || "—"}
          </span>
        </p>
        <p className="mt-1 text-xs text-txt-muted">
          {formatServiceLabel(visit.serviceType)}
          {visit.doctorNombre ? ` · Dr(a). ${visit.doctorNombre}` : ""}
        </p>
        {timestamp ? (
          <p className="mt-1.5 text-xs text-txt-muted">
            {timestamp.label}:{" "}
            <span className="font-mono font-semibold text-txt-body">
              {timestamp.value}
            </span>
          </p>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Bandeja operativa para el medico: TODOS los pacientes en proceso
 * (en_espera -> en_somatometria -> lista_para_doctor -> en_consulta), sin
 * filtrar por medico asignado (decision del usuario: muchos walk-ins no
 * tienen doctorId todavia en las etapas tempranas). Vista de solo lectura
 * -- sin acciones, a diferencia de la cola de atencion propiamente dicha
 * (`DoctorConsultationPage` tab "Consulta").
 */
export function DoctorPipelineView() {
  const { data, isLoading, isError } = useDoctorPipelineQueue();

  const visits = data?.items ?? [];

  return (
    <div className="space-y-4" data-testid="doctor-pipeline-view">
      {isLoading ? (
        <p className="text-sm text-txt-muted">Cargando pipeline de pacientes...</p>
      ) : null}

      {isError ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>
            No se pudo cargar el estado de los pacientes en proceso.
          </AlertDescription>
        </Alert>
      ) : null}

      {!isLoading && !isError && visits.length === 0 ? (
        <p className="text-sm text-txt-muted">
          No hay pacientes en proceso en este momento.
        </p>
      ) : null}

      {!isLoading && !isError && visits.length > 0 ? (
        <div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          data-testid="doctor-pipeline-cards"
        >
          {visits.map((visit) => (
            <PipelineCard key={visit.id} visit={visit} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default DoctorPipelineView;
