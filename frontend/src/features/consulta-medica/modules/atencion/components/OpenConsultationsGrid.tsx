import { Clock } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { VISIT_STATUS, type VisitQueueItem } from "@api/types";
import { AppointmentAlertBadge, ConsultationElapsedBadge } from "./ConsultationBadges";
import {
  formatArrivalTypeLabel,
  formatDateShort,
  formatServiceTypeLabel,
  formatStatusLabel,
  getMinutesUntilAppointment,
} from "../pages/DoctorConsultationPage.helpers";

interface Props {
  visits:                          VisitQueueItem[];
  now:                             Date;
  consultationStartedAtByVisitId:  Record<number, Date>;
  onSelectVisit:                   (visitId: number) => void;
}

export function OpenConsultationsGrid({
  visits,
  now,
  consultationStartedAtByVisitId,
  onSelectVisit,
}: Props) {
  return (
    <article className="rounded-xl border border-line-struct bg-paper p-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-txt-body">
          Consultas abiertas ({visits.length})
        </p>
        <p className="text-sm text-txt-muted">
          Selecciona una card para abrir el detalle de atencion clinica.
        </p>
      </div>

      <div
        className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        data-testid="doctor-open-consultations-grid"
      >
        {visits.map((visit) => {
          const minutesUntil = getMinutesUntilAppointment(visit.horaConsulta, now);
          const appointmentDate = visit.fechaConsulta
            ? formatDateShort(visit.fechaConsulta)
            : visit.fechaCita
            ? formatDateShort(visit.fechaCita)
            : null;
          const isNow    = minutesUntil !== null && minutesUntil >= -5  && minutesUntil <= 5;
          const isUrgent = minutesUntil !== null && minutesUntil > 5    && minutesUntil <= 15;

          return (
            <button
              key={visit.id}
              type="button"
              className={[
                "rounded-lg border bg-paper p-3 text-left transition hover:border-brand/50",
                isNow    ? "border-red-300"    :
                isUrgent ? "border-amber-300"  :
                           "border-line-hairline",
              ].join(" ")}
              data-testid={`doctor-visit-card-${visit.id}`}
              data-visit-folio={visit.folio}
              onClick={() => { onSelectVisit(visit.id); }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-txt-body font-mono">
                  {visit.folio}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {visit.status === VISIT_STATUS.EN_CONSULTA ? (
                    <ConsultationElapsedBadge
                      startedAt={consultationStartedAtByVisitId[visit.id]}
                      now={now}
                    />
                  ) : (
                    <AppointmentAlertBadge minutesUntil={minutesUntil} />
                  )}
                  <Badge variant="outline" className="uppercase">
                    {formatStatusLabel(visit.status)}
                  </Badge>
                </div>
              </div>
              {visit.nombrePaciente ? (
                <p className="mt-1.5 text-sm font-semibold text-txt-body">
                  {visit.nombrePaciente}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-txt-muted font-mono">
                Exp. {visit.noExp}{visit.pkNum > 0 ? ` · familiar #${visit.pkNum}` : ""}
              </p>
              <p className="mt-1 text-xs text-txt-muted">
                {formatServiceTypeLabel(visit.serviceType)} ·{" "}
                {formatArrivalTypeLabel(visit.arrivalType)}
              </p>
              {visit.horaConsulta ? (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Clock className="size-3 text-primary/70 shrink-0" />
                  <span className="text-xs font-mono font-semibold text-primary">
                    {visit.horaConsulta}
                  </span>
                  {appointmentDate ? (
                    <span className="text-xs text-txt-muted">{appointmentDate}</span>
                  ) : null}
                </div>
              ) : null}
              {visit.doctorNombre ? (
                <p className="mt-1 text-xs text-txt-muted">
                  Dr. {visit.doctorNombre}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </article>
  );
}
