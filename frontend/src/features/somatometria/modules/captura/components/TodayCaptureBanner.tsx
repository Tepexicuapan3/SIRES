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

interface TodayCaptureBannerProps {
  todayCapture: TodayCapturePayload;
  /** Reusa los valores de hoy Y avanza la visita a consulta en un solo
   * click. El formulario de captura ya arranca precargado con estos mismos
   * valores (editable) -- este boton es el atajo para cuando no hace falta
   * revisar nada antes de enviar. */
  onPasarDirectoAConsulta: () => void;
  disabled?: boolean;
}

/**
 * Aviso de reuso de signos vitales del mismo dia. El formulario de captura
 * (`SomatometriaCapturePage.tsx`) ya arranca precargado con estos valores
 * por default -- este banner es informativo (de donde salen los datos que
 * ve prellenados) mas el atajo de un solo click a consulta. Ya no hay
 * decision explicita "Reusar/Capturar nuevos": el formulario prellenado Y
 * editable ES la captura por default; si la enfermera necesita valores
 * distintos, los edita/borra directo en el formulario.
 */
export function TodayCaptureBanner({
  todayCapture,
  onPasarDirectoAConsulta,
  disabled,
}: TodayCaptureBannerProps) {
  return (
    <Alert variant="info" data-testid="today-capture-banner">
      <AlertTitle>Ya se tomaron signos vitales hoy</AlertTitle>
      <AlertDescription>
        Folio {todayCapture.sourceFolio} ·{" "}
        {formatServiceLabel(todayCapture.sourceServiceType)} ·{" "}
        {formatCapturedAtDateTime(todayCapture.capturedAt)}
        {" · "}Estos valores ya estan precargados en el formulario de abajo.
      </AlertDescription>

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

      <div className="flex flex-wrap gap-2 pt-3">
        <Button
          type="button"
          size="sm"
          data-testid="today-capture-direct-button"
          disabled={disabled}
          onClick={onPasarDirectoAConsulta}
        >
          Pasar directo a consulta
        </Button>
      </div>
    </Alert>
  );
}

export default TodayCaptureBanner;
