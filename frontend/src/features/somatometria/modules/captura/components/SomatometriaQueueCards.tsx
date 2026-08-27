import { VISIT_SERVICE, type VisitQueueItem } from "@api/types";
import { Badge } from "@shared/ui/badge";
import { useRelativeChangeTracker } from "@shared/hooks/useRelativeChangeTracker";

/** Duplicado deliberado (y minimo) del label de servicio -- no se extrae un
 * helper compartido con `consulta-medica`/`recepcion` para esta feature
 * puntual (fuera de scope del change). */
const SOMATO_SERVICE_LABEL: Record<string, string> = {
  [VISIT_SERVICE.MEDICINA_GENERAL]: "Medicina general",
  [VISIT_SERVICE.ESPECIALIDAD]: "Especialidad",
  [VISIT_SERVICE.URGENCIAS]: "Urgencias",
};

const formatServiceLabel = (serviceType: string): string =>
  SOMATO_SERVICE_LABEL[serviceType] ?? serviceType;

/** Fecha+hora legible -- mismo criterio de formato que `formatCapturedAtDateTime`
 * en `TodayCaptureBanner.tsx` (dia/mes/año + hora:minuto, 24h, es-MX), para
 * mantener consistencia visual entre los distintos "momentos" que se
 * muestran en el modulo. NO se exporta (el linter de fast-refresh no
 * permite mezclar exports de componente + funcion en el mismo archivo);
 * `SomatometriaHistorialView.tsx` duplica esta misma logica de formato de
 * forma deliberada y minima, con el mismo criterio documentado aca. */
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

interface SomatometriaQueueCardsProps {
  visits: VisitQueueItem[];
  selectedVisitId: number | null;
  onSelectVisit: (visitId: number) => void;
}

/** Cola visual de somatometria: reemplaza el `<Select>` plano por tarjetas,
 * imitando el patron visual de `BandejaView.tsx` (banda superior con
 * folio/badge, datos del paciente, detalle de hora/servicio). Los datos ya
 * llegan en tiempo real via `useSomatometriaQueue` -- este componente solo
 * los presenta y expone la seleccion, sin logica propia de fetching. */
export function SomatometriaQueueCards({
  visits,
  selectedVisitId,
  onSelectVisit,
}: SomatometriaQueueCardsProps) {
  /** Badge 100% client-side de "Nuevo"/"Hace N min" -- ver
   * `useRelativeChangeTracker` (shared/hooks). NO depende de ningun evento
   * de realtime nuevo: el bridge actual (`useVisitRealtimeBridge.ts`) sigue
   * haciendo refetch completo, sin cambios. */
  const relativeLabels = useRelativeChangeTracker(
    visits.map((visit) => ({ id: visit.id, changeKey: visit.fechaModf })),
  );

  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="somato-queue-cards"
    >
      {visits.map((visit) => {
        const isSelected = visit.id === selectedVisitId;
        const relativeLabel = relativeLabels.get(visit.id);

        return (
          <button
            key={visit.id}
            type="button"
            aria-pressed={isSelected}
            data-testid={`somato-visit-card-${visit.id}`}
            data-visit-folio={visit.folio}
            className={[
              "flex flex-col overflow-hidden rounded-xl border bg-paper text-left transition",
              isSelected
                ? "border-primary ring-2 ring-primary/30"
                : "border-line-struct hover:border-primary/50",
            ].join(" ")}
            onClick={() => {
              onSelectVisit(visit.id);
            }}
          >
            {/* Banda superior: folio + servicio */}
            <div className="flex items-center justify-between gap-2 border-b border-line-hairline bg-subtle/30 px-4 py-2">
              <span className="font-mono text-xs text-txt-muted">
                {visit.folio}
              </span>
              <Badge variant="outline" className="uppercase">
                {formatServiceLabel(visit.serviceType)}
              </Badge>
            </div>

            {/* Datos del paciente */}
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
                {visit.pkNum > 0 ? (
                  <span className="ml-1 font-sans font-normal">
                    {" "}
                    · Familiar #{visit.pkNum}
                  </span>
                ) : (
                  <span className="ml-1 font-sans font-normal"> · Titular</span>
                )}
              </p>
              <p className="mt-1.5 text-xs text-txt-muted">
                En somatometría desde:{" "}
                <span className="font-mono font-semibold text-txt-body">
                  {formatDateTime(visit.enSomatometriaAt)}
                </span>
              </p>
              <p className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className={
                    visit.vitals
                      ? "border-status-success/40 text-status-success"
                      : "border-status-alert/40 text-status-alert"
                  }
                >
                  {visit.vitals ? "Vitales capturados" : "Vitales pendientes"}
                </Badge>
                {relativeLabel ? (
                  <Badge
                    variant={relativeLabel === "Nuevo" ? "brand" : "secondary"}
                    data-testid={`somato-visit-card-${visit.id}-relative-badge`}
                  >
                    {relativeLabel}
                  </Badge>
                ) : null}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default SomatometriaQueueCards;
