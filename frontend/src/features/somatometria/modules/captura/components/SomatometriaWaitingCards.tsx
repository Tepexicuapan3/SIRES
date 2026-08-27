import type { VisitQueueItem } from "@api/types";
import { Badge } from "@shared/ui/badge";
import { useRelativeChangeTracker } from "@shared/hooks/useRelativeChangeTracker";

/** Fecha+hora legible -- mismo criterio que `formatDateTime` en
 * `SomatometriaQueueCards.tsx` (dia/mes/año + hora:minuto, 24h, es-MX). */
const formatDateTime = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

interface SomatometriaWaitingCardsProps {
  visits: VisitQueueItem[];
}

/** Cola visual de "en espera de pasar a somatometria" -- version liviana de
 * `SomatometriaQueueCards.tsx`, con SOLO los campos que le sirven a la
 * enfermera para anticipar quien viene despues (nombre + hora de llegada).
 * A diferencia de la bandeja de recepcion (`BandejaView.tsx`) NO muestra
 * folio/medico/consultorio ni acciones: estas visitas todavia no estan en
 * un estado donde la enfermera pueda actuar sobre ellas, asi que las
 * tarjetas son solo informativas (no clickeables, no seleccionables). */
export function SomatometriaWaitingCards({
  visits,
}: SomatometriaWaitingCardsProps) {
  /** Mismo tracker 100% client-side que `SomatometriaQueueCards.tsx` -- ver
   * `useRelativeChangeTracker` (shared/hooks). */
  const relativeLabels = useRelativeChangeTracker(
    visits.map((visit) => ({ id: visit.id, changeKey: visit.fechaModf })),
  );

  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="somato-waiting-cards"
    >
      {visits.map((visit) => {
        const relativeLabel = relativeLabels.get(visit.id);

        return (
          <div
            key={visit.id}
            data-testid={`somato-waiting-card-${visit.id}`}
            className="flex flex-col overflow-hidden rounded-xl border border-line-struct bg-paper text-left"
          >
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
              <p className="mt-1.5 text-xs text-txt-muted">
                Llegó a recepción:{" "}
                <span className="font-mono font-semibold text-txt-body">
                  {formatDateTime(visit.fechaAlta)}
                </span>
              </p>
              {relativeLabel ? (
                <p className="mt-1.5">
                  <Badge
                    variant={relativeLabel === "Nuevo" ? "brand" : "secondary"}
                    data-testid={`somato-waiting-card-${visit.id}-relative-badge`}
                  >
                    {relativeLabel}
                  </Badge>
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SomatometriaWaitingCards;
