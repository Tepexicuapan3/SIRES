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

      {/* Valores visibles SIEMPRE, sin importar la decision -- la enfermera
       * necesita verlos para poder analizarlos clinicamente ANTES de
       * decidir si reusar o volver a tomar, no recien despues de elegir
       * "Reusar" (que ademas ya los precarga en el formulario). */}
      <dl
        className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-3"
        data-testid="today-capture-values"
      >
        <div>
          <dt className="text-txt-muted">Peso</dt>
          <dd className="font-semibold text-txt-body">
            {todayCapture.values.weightKg} kg
          </dd>
        </div>
        <div>
          <dt className="text-txt-muted">Talla</dt>
          <dd className="font-semibold text-txt-body">
            {todayCapture.values.heightCm} cm
          </dd>
        </div>
        <div>
          <dt className="text-txt-muted">IMC</dt>
          <dd className="font-semibold text-txt-body">
            {todayCapture.values.bmi}
          </dd>
        </div>
        {todayCapture.values.temperatureC != null ? (
          <div>
            <dt className="text-txt-muted">Temp.</dt>
            <dd className="font-semibold text-txt-body">
              {todayCapture.values.temperatureC} °C
            </dd>
          </div>
        ) : null}
        {todayCapture.values.oxygenSaturationPct != null ? (
          <div>
            <dt className="text-txt-muted">Sat. O2</dt>
            <dd className="font-semibold text-txt-body">
              {todayCapture.values.oxygenSaturationPct}%
            </dd>
          </div>
        ) : null}
        {todayCapture.values.bloodPressureSystolic != null &&
        todayCapture.values.bloodPressureDiastolic != null ? (
          <div>
            <dt className="text-txt-muted">T.A.</dt>
            <dd className="font-semibold text-txt-body">
              {todayCapture.values.bloodPressureSystolic}/
              {todayCapture.values.bloodPressureDiastolic}
            </dd>
          </div>
        ) : null}
        {todayCapture.values.heartRateBpm != null ? (
          <div>
            <dt className="text-txt-muted">Frec. cardiaca</dt>
            <dd className="font-semibold text-txt-body">
              {todayCapture.values.heartRateBpm} lpm
            </dd>
          </div>
        ) : null}
        {todayCapture.values.respiratoryRateBpm != null ? (
          <div>
            <dt className="text-txt-muted">Frec. respiratoria</dt>
            <dd className="font-semibold text-txt-body">
              {todayCapture.values.respiratoryRateBpm} rpm
            </dd>
          </div>
        ) : null}
        {todayCapture.values.glucosaCapilarMgdl != null ? (
          <div>
            <dt className="text-txt-muted">Glucosa capilar</dt>
            <dd className="font-semibold text-txt-body">
              {todayCapture.values.glucosaCapilarMgdl} mg/dL
            </dd>
          </div>
        ) : null}
        {todayCapture.values.waistCircumferenceCm != null ? (
          <div>
            <dt className="text-txt-muted">Cintura</dt>
            <dd className="font-semibold text-txt-body">
              {todayCapture.values.waistCircumferenceCm} cm
            </dd>
          </div>
        ) : null}
      </dl>

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
