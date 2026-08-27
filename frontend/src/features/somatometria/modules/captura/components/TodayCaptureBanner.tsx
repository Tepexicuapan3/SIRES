import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { VISIT_SERVICE, type TodayCapturePayload } from "@api/types";

/** Duplicado deliberado (y minimo) del label de servicio -- ver nota en
 * `SomatometriaQueueCards.tsx`. */
const TODAY_CAPTURE_SERVICE_LABEL: Record<string, string> = {
  [VISIT_SERVICE.MEDICINA_GENERAL]: "Medicina general",
  [VISIT_SERVICE.ESPECIALIDAD]: "Especialidad",
  [VISIT_SERVICE.URGENCIAS]: "Urgencias",
};

const formatServiceLabel = (serviceType: string): string =>
  TODAY_CAPTURE_SERVICE_LABEL[serviceType] ?? serviceType;

const formatCapturedAtDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export type TodayCaptureDecision = "pending" | "reused" | "fresh";

interface TodayCaptureBannerProps {
  todayCapture: TodayCapturePayload;
  decision: TodayCaptureDecision;
  onReuse: () => void;
  onCaptureFresh: () => void;
  disabled?: boolean;
}

/** Aviso de reuso de signos vitales del mismo dia. La decision NUNCA viene
 * preseleccionada: arranca en `"pending"` y exige un click explicito de la
 * enfermera (Reusar / Capturar nuevos), distinto del boton "Guardar" del
 * formulario -- ninguna accion se dispara automaticamente. */
export function TodayCaptureBanner({
  todayCapture,
  decision,
  onReuse,
  onCaptureFresh,
  disabled,
}: TodayCaptureBannerProps) {
  return (
    <Alert variant="info" data-testid="today-capture-banner">
      <AlertTitle>Ya se tomaron signos vitales hoy</AlertTitle>
      <AlertDescription>
        Folio {todayCapture.sourceFolio} ·{" "}
        {formatServiceLabel(todayCapture.sourceServiceType)} ·{" "}
        {formatCapturedAtDateTime(todayCapture.capturedAt)}
      </AlertDescription>

      {decision === "pending" ? (
        <div className="flex flex-wrap gap-2 pt-3">
          <Button
            type="button"
            size="sm"
            data-testid="today-capture-reuse-button"
            disabled={disabled}
            onClick={onReuse}
          >
            Reusar estos valores
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="today-capture-fresh-button"
            disabled={disabled}
            onClick={onCaptureFresh}
          >
            Capturar nuevos
          </Button>
        </div>
      ) : (
        <p
          className="pt-3 text-xs text-txt-muted"
          data-testid="today-capture-decision-label"
        >
          {decision === "reused"
            ? "Reusando los valores de hoy. Revisalos antes de guardar."
            : "Capturando signos vitales nuevos para esta visita."}
        </p>
      )}
    </Alert>
  );
}

export default TodayCaptureBanner;
