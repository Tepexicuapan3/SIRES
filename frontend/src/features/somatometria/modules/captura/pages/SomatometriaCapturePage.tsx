import { useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { ApiError } from "@api/utils/errors";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Separator } from "@shared/ui/separator";
import { Textarea } from "@shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { toast } from "sonner";
import { VISIT_STATUS } from "@api/types";
import { canCaptureVitals } from "@features/operativo/shared/domain/visit-flow.constants";
import {
  captureVitalsFormSchema,
  type CaptureVitalsFormInput,
  type CaptureVitalsFormValues,
} from "@features/somatometria/modules/captura/domain/capture-vitals.schemas";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { useCaptureVitals } from "@features/somatometria/modules/captura/mutations/useCaptureVitals";
import { useSomatometriaQueue } from "@features/somatometria/modules/captura/queries/useSomatometriaQueue";
import { usePatientLookupHistorico } from "@features/recepcion/modules/checkin/queries/usePatientLookup";

// ─── Constantes ───────────────────────────────────────────────────────────────

const CAPTURE_VITALS_DOMAIN_ERROR_MESSAGE: Record<
  "VITALS_INCOMPLETE" | "ROLE_NOT_ALLOWED" | "VISIT_STATE_INVALID",
  string
> = {
  VITALS_INCOMPLETE:
    "No se puede liberar la visita: completa los vitales minimos requeridos.",
  ROLE_NOT_ALLOWED: "No tenes permiso para capturar vitales en esta visita.",
  VISIT_STATE_INVALID:
    "La visita ya no esta en un estado valido para somatometria. Actualiza la bandeja.",
};

type CaptureVitalsDomainErrorCode =
  keyof typeof CAPTURE_VITALS_DOMAIN_ERROR_MESSAGE;

const FALLBACK_CAPTURE_VITALS_ERROR_MESSAGE =
  "No se pudieron guardar los vitales. Intenta nuevamente.";

const DEFAULT_FORM_VALUES: CaptureVitalsFormInput = {
  weightKg: "",
  heightCm: "",
  temperatureC: "",
  oxygenSaturationPct: "",
  heartRateBpm: "",
  respiratoryRateBpm: "",
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
  glucosaCapilarMgdl: "",
  observations: "",
};

const SOMATOMETRIA_QUEUE_PERMISSION_REQUIREMENT = {
  allOf: ["clinico:somatometria:read"],
} as const;

const SOMATOMETRIA_CAPTURE_PERMISSION_REQUIREMENT = {
  allOf: ["clinico:somatometria:read"],
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toPositiveNumber = (value: unknown): number | null => {
  const normalized =
    typeof value === "number" ? value : Number(value ?? Number.NaN);
  if (!Number.isFinite(normalized) || normalized <= 0) return null;
  return normalized;
};

const calculateBmi = (weightKg: number, heightCm: number): number => {
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(2));
};

const formatBmi = (value: number): string => value.toFixed(2);

const formatStatusLabel = (status: string): string =>
  status.replace(/_/g, " ");

const formatFechaNac = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const buildCaptureVitalsPayload = (values: CaptureVitalsFormValues) => ({
  weightKg:              values.weightKg,
  heightCm:              values.heightCm,
  temperatureC:          values.temperatureC,
  oxygenSaturationPct:   values.oxygenSaturationPct,
  heartRateBpm:          values.heartRateBpm,
  respiratoryRateBpm:    values.respiratoryRateBpm,
  bloodPressureSystolic: values.bloodPressureSystolic,
  bloodPressureDiastolic: values.bloodPressureDiastolic,
  glucosaCapilarMgdl:    values.glucosaCapilarMgdl,
  waistCircumferenceCm:  undefined,
  notes:                 values.observations,
});

const resolveCaptureVitalsErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) return FALLBACK_CAPTURE_VITALS_ERROR_MESSAGE;
  const domainCode = error.code as CaptureVitalsDomainErrorCode;
  if (domainCode in CAPTURE_VITALS_DOMAIN_ERROR_MESSAGE)
    return CAPTURE_VITALS_DOMAIN_ERROR_MESSAGE[domainCode];
  return error.message || FALLBACK_CAPTURE_VITALS_ERROR_MESSAGE;
};

// ─── Componentes internos ─────────────────────────────────────────────────────

interface MetricFieldProps {
  fieldId: string;
  label: string;
  unit: string;
  step?: number;
  disabled?: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
  optional?: boolean;
}

const MetricField = ({
  fieldId,
  label,
  unit,
  step,
  disabled,
  error,
  registration,
  optional,
}: MetricFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={fieldId}>
      {label}
      {optional ? (
        <span className="ml-1 text-xs font-normal text-txt-muted">(opcional)</span>
      ) : null}
    </Label>
    <div className="flex overflow-hidden rounded-2xl border border-line-struct bg-paper">
      <Input
        id={fieldId}
        data-testid={`somato-${fieldId}-input`}
        type="number"
        step={step}
        disabled={disabled}
        className="rounded-none border-0 focus-visible:ring-0"
        {...registration}
      />
      <span className="inline-flex min-w-16 items-center justify-center border-l border-line-hairline bg-subtle px-3 text-sm text-txt-muted">
        {unit}
      </span>
    </div>
    {error ? (
      <p className="text-sm text-status-critical" role="alert">
        {error}
      </p>
    ) : null}
  </div>
);

function PatientInfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted">
        {label}
      </span>
      <span className="text-sm font-medium text-txt-body">{value ?? "—"}</span>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export const SomatometriaCapturePage = () => {
  const { hasCapability } = usePermissionDependencies();
  const canReadSomatometriaQueue = hasCapability(
    "flow.somatometria.queue.read",
    SOMATOMETRIA_QUEUE_PERMISSION_REQUIREMENT,
  );
  const canCaptureSomatometriaVitals = hasCapability(
    "flow.somatometria.capture",
    SOMATOMETRIA_CAPTURE_PERMISSION_REQUIREMENT,
  );

  const queueQuery = useSomatometriaQueue({ enabled: canReadSomatometriaQueue });
  const captureVitals = useCaptureVitals();

  const [selectedVisitIdState, setSelectedVisitIdState] = useState<number | null>(null);
  const [capturedBmi, setCapturedBmi] = useState<number | null>(null);

  const form = useForm<CaptureVitalsFormInput, unknown, CaptureVitalsFormValues>({
    resolver: zodResolver(captureVitalsFormSchema),
    mode: "onChange",
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const visits = queueQuery.data?.items ?? [];

  const selectedVisitId =
    selectedVisitIdState !== null && visits.some((v) => v.id === selectedVisitIdState)
      ? selectedVisitIdState
      : (visits[0]?.id ?? null);

  const selectedVisit = visits.find((v) => v.id === selectedVisitId) ?? null;

  const canCaptureSelectedVisit =
    selectedVisit
      ? canCaptureSomatometriaVitals && canCaptureVitals(selectedVisit.status)
      : false;

  // Lookup de datos del paciente para mostrar edad y fecha nac
  const { data: patientData, isFetching: loadingPatient } = usePatientLookupHistorico(
    selectedVisit?.noExp ?? "",
    !!selectedVisit?.noExp,
  );

  const paciente = patientData
    ? [patientData.titular, ...patientData.dependientes]
        .filter(Boolean)
        .find((m) => m!.pkNum === selectedVisit?.pkNum) ?? null
    : null;

  const [watchedWeightKg, watchedHeightCm] = useWatch({
    control: form.control,
    name: ["weightKg", "heightCm"],
  });

  const previewWeight = toPositiveNumber(watchedWeightKg);
  const previewHeight = toPositiveNumber(watchedHeightCm);
  const bmiPreview =
    previewWeight !== null && previewHeight !== null
      ? calculateBmi(previewWeight, previewHeight)
      : null;
  const visibleBmi = bmiPreview ?? capturedBmi;

  const resetCaptureForm = () => {
    form.reset(DEFAULT_FORM_VALUES);
    setCapturedBmi(null);
  };

  const handleVisitChange = (nextVisitId: number) => {
    setSelectedVisitIdState(nextVisitId);
    resetCaptureForm();
  };

  const handleCaptureVitals = async (values: CaptureVitalsFormValues) => {
    if (!selectedVisit || !canCaptureSomatometriaVitals || !canCaptureSelectedVisit) return;

    try {
      const result = await captureVitals.mutateAsync({
        visitId: selectedVisit.id,
        data: buildCaptureVitalsPayload(values),
      });

      setCapturedBmi(result.vitals.bmi);
      toast.success("Signos vitales guardados correctamente.", {
        description: `Visita ${selectedVisit.folio} actualizada.`,
      });
      resetCaptureForm();
    } catch (error) {
      setCapturedBmi(null);
      toast.error("No se pudo guardar", {
        description: resolveCaptureVitalsErrorMessage(error),
      });
    }
  };

  const currentStatus = selectedVisit?.status ?? VISIT_STATUS.EN_SOMATOMETRIA;
  const isFormDisabled = !canCaptureSelectedVisit || captureVitals.isPending;

  return (
    <section className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-txt-body">
          Somatometría
        </h1>
        <p className="text-sm text-txt-muted">
          Captura los signos vitales de la visita activa.
        </p>
      </header>

      {!canReadSomatometriaQueue ? (
        <p className="text-sm text-txt-muted" role="status">
          No tenes permisos completos para cargar la bandeja de somatometria.
        </p>
      ) : null}

      {canReadSomatometriaQueue && queueQuery.isLoading ? (
        <p className="text-sm text-txt-muted">Cargando bandeja...</p>
      ) : null}

      {canReadSomatometriaQueue && queueQuery.isError ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>
            No se pudo cargar la bandeja de somatometria.
          </AlertDescription>
        </Alert>
      ) : null}

      {canReadSomatometriaQueue &&
      !queueQuery.isLoading &&
      !queueQuery.isError &&
      visits.length === 0 ? (
        <p className="text-sm text-txt-muted">No hay pacientes en somatometria.</p>
      ) : null}

      {canReadSomatometriaQueue &&
      !queueQuery.isLoading &&
      !queueQuery.isError &&
      visits.length > 0 ? (
        <section className="space-y-5 rounded-xl border border-line-hairline bg-paper p-5">

          {/* ── Selector de visita ─────────────────────────────── */}
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="visit-selector">Visita activa</Label>
              <Select
                value={selectedVisitId?.toString() ?? ""}
                onValueChange={(value) => handleVisitChange(Number(value))}
              >
                <SelectTrigger
                  id="visit-selector"
                  className="w-full"
                  data-testid="somato-visit-selector"
                >
                  <SelectValue placeholder="Selecciona una visita" />
                </SelectTrigger>
                <SelectContent>
                  {visits.map((visit) => (
                    <SelectItem key={visit.id} value={visit.id.toString()}>
                      {visit.folio} — {visit.nombrePaciente ?? formatStatusLabel(visit.status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-txt-muted">Folio</p>
              <p className="text-sm font-medium font-mono text-txt-body">
                {selectedVisit?.folio}
              </p>
            </div>
            <Badge
              variant="outline"
              className="justify-self-start uppercase md:justify-self-end"
            >
              {formatStatusLabel(currentStatus)}
            </Badge>
          </div>

          {/* ── Datos del paciente ─────────────────────────────── */}
          {selectedVisit ? (
            <div className="rounded-xl border border-line-struct/60 bg-subtle/20 px-4 py-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-txt-muted">
                Datos del paciente
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                <PatientInfoRow
                  label="Nombre"
                  value={selectedVisit.nombrePaciente}
                />
                <PatientInfoRow
                  label="Expediente"
                  value={
                    selectedVisit.noExp ? (
                      <span className="font-mono">
                        {selectedVisit.noExp}
                        {selectedVisit.pkNum > 0 ? (
                          <span className="ml-1 text-xs font-sans text-txt-muted">
                            Fam. #{selectedVisit.pkNum}
                          </span>
                        ) : null}
                      </span>
                    ) : "Sin expediente"
                  }
                />
                <PatientInfoRow
                  label="Edad"
                  value={
                    loadingPatient
                      ? "..."
                      : paciente?.edad != null
                      ? `${paciente.edad} años`
                      : null
                  }
                />
                <PatientInfoRow
                  label="Fecha nac."
                  value={
                    loadingPatient ? "..." : formatFechaNac(paciente?.fechaNac)
                  }
                />
              </div>
            </div>
          ) : null}

          <Separator />

          {/* ── Formulario de vitales ──────────────────────────── */}
          <form
            className="space-y-5"
            noValidate
            onSubmit={form.handleSubmit(handleCaptureVitals)}
          >
            {/* Estatura + Peso */}
            <div className="grid gap-4 md:grid-cols-2">
              <MetricField
                fieldId="heightCm"
                label="Estatura"
                unit="cm"
                step={0.1}
                disabled={isFormDisabled}
                error={form.formState.errors.heightCm?.message}
                registration={form.register("heightCm")}
              />
              <MetricField
                fieldId="weightKg"
                label="Peso"
                unit="kg"
                step={0.1}
                disabled={isFormDisabled}
                error={form.formState.errors.weightKg?.message}
                registration={form.register("weightKg")}
              />
            </div>

            {/* IMC (calculado) + Temperatura */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bmi">IMC</Label>
                <div className="flex overflow-hidden rounded-2xl border border-line-struct bg-paper">
                  <Input
                    id="bmi"
                    data-testid="somato-bmi-input"
                    readOnly
                    value={visibleBmi !== null ? formatBmi(visibleBmi) : "--"}
                    className="rounded-none border-0 focus-visible:ring-0 text-txt-muted"
                  />
                  <span className="inline-flex min-w-20 items-center justify-center border-l border-line-hairline bg-subtle px-3 text-sm text-txt-muted">
                    kg/m²
                  </span>
                </div>
              </div>
              <MetricField
                fieldId="temperatureC"
                label="Temperatura"
                unit="°C"
                step={0.1}
                disabled={isFormDisabled}
                error={form.formState.errors.temperatureC?.message}
                registration={form.register("temperatureC")}
              />
            </div>

            {/* Saturación O2 + Frecuencia Cardiaca */}
            <div className="grid gap-4 md:grid-cols-2">
              <MetricField
                fieldId="oxygenSaturationPct"
                label="Saturación de oxígeno"
                unit="%"
                disabled={isFormDisabled}
                error={form.formState.errors.oxygenSaturationPct?.message}
                registration={form.register("oxygenSaturationPct")}
              />
              <MetricField
                fieldId="heartRateBpm"
                label="Frecuencia cardiaca"
                unit="lpm"
                optional
                disabled={isFormDisabled}
                error={form.formState.errors.heartRateBpm?.message}
                registration={form.register("heartRateBpm")}
              />
            </div>

            {/* Frecuencia Respiratoria + Glucosa Capilar */}
            <div className="grid gap-4 md:grid-cols-2">
              <MetricField
                fieldId="respiratoryRateBpm"
                label="Frecuencia respiratoria"
                unit="rpm"
                optional
                disabled={isFormDisabled}
                error={form.formState.errors.respiratoryRateBpm?.message}
                registration={form.register("respiratoryRateBpm")}
              />
              <MetricField
                fieldId="glucosaCapilarMgdl"
                label="Glucosa capilar"
                unit="mg/dL"
                optional
                disabled={isFormDisabled}
                error={form.formState.errors.glucosaCapilarMgdl?.message}
                registration={form.register("glucosaCapilarMgdl")}
              />
            </div>

            {/* Tensión Arterial */}
            <div className="space-y-2">
              <p className="text-sm font-medium leading-none">
                Tensión arterial
                <span className="ml-1 text-xs font-normal text-txt-muted">(opcional)</span>
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <MetricField
                  fieldId="bloodPressureSystolic"
                  label="Sistólica"
                  unit="mmHg"
                  disabled={isFormDisabled}
                  error={form.formState.errors.bloodPressureSystolic?.message}
                  registration={form.register("bloodPressureSystolic")}
                />
                <MetricField
                  fieldId="bloodPressureDiastolic"
                  label="Diastólica"
                  unit="mmHg"
                  disabled={isFormDisabled}
                  error={form.formState.errors.bloodPressureDiastolic?.message}
                  registration={form.register("bloodPressureDiastolic")}
                />
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observations">
                Observaciones
                <span className="ml-1 text-xs font-normal text-txt-muted">(opcional)</span>
              </Label>
              <Textarea
                id="observations"
                data-testid="somato-observations-input"
                rows={3}
                disabled={isFormDisabled}
                placeholder="Observaciones clínicas relevantes..."
                {...form.register("observations")}
              />
              {form.formState.errors.observations?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.observations.message}
                </p>
              ) : null}
            </div>

            {/* Guardar */}
            <div className="border-t border-line-hairline pt-4">
              <Button
                type="submit"
                data-testid="somato-save-button"
                className="w-full md:w-auto"
                disabled={isFormDisabled}
              >
                {captureVitals.isPending ? "Guardando..." : "Guardar signos vitales"}
              </Button>
            </div>
          </form>

          {!canCaptureSomatometriaVitals ? (
            <p className="text-sm text-txt-muted" role="status">
              No tenes permisos completos para guardar vitales.
            </p>
          ) : null}

          {canCaptureSomatometriaVitals && !canCaptureSelectedVisit ? (
            <p className="text-sm text-status-alert" role="status">
              Selecciona una visita en somatometria para capturar vitales.
            </p>
          ) : null}
        </section>
      ) : null}
    </section>
  );
};

export default SomatometriaCapturePage;
