import { VISIT_SERVICE, type VisitQueueItem } from "@api/types";
import { Badge } from "@shared/ui/badge";

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

const formatArrivalTime = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "--:--";

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
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="somato-queue-cards"
    >
      {visits.map((visit) => {
        const isSelected = visit.id === selectedVisitId;

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
                Ingreso a cola:{" "}
                <span className="font-mono font-semibold text-txt-body">
                  {formatArrivalTime(visit.fechaAlta)}
                </span>
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default SomatometriaQueueCards;
