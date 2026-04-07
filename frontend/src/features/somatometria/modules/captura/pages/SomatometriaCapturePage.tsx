import { useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { ApiError } from "@api/utils/errors";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { toast } from "sonner";
import { VISIT_STATUS, type VisitVitalsPayload } from "@api/types";
import { canCaptureVitals } from "@features/operativo/shared/domain/visit-flow.constants";
import {
  captureVitalsFormSchema,
  type CaptureVitalsFormInput,
  type CaptureVitalsFormValues,
} from "@features/somatometria/modules/captura/domain/capture-vitals.schemas";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { useCaptureVitals } from "@features/somatometria/modules/captura/mutations/useCaptureVitals";
import { useSomatometriaQueue } from "@features/somatometria/modules/captura/queries/useSomatometriaQueue";

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
  observations: "",
};

const SOMATOMETRIA_QUEUE_PERMISSION_REQUIREMENT = {
  allOf: ["clinico:somatometria:read"],
} as const;

const SOMATOMETRIA_CAPTURE_PERMISSION_REQUIREMENT = {
  allOf: ["clinico:somatometria:read"],
} as const;

const toPositiveNumber = (value: unknown): number | null => {
  const normalized =
    typeof value === "number" ? value : Number(value ?? Number.NaN);

  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }

  return normalized;
};

const calculateBmi = (weightKg: number, heightCm: number): number => {
  const heightMeters = heightCm / 100;
  const bmi = weightKg / (heightMeters * heightMeters);
  return Number(bmi.toFixed(2));
};

const formatBmi = (value: number): string => {
  return value.toFixed(2);
};

const formatStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ");
};

const buildCaptureVitalsPayload = (
  values: CaptureVitalsFormValues,
  previousVitals?: VisitVitalsPayload | null,
) => {
  return {
    weightKg: values.weightKg,
    heightCm: values.heightCm,
    temperatureC: values.temperatureC,
    oxygenSaturationPct: values.oxygenSaturationPct,
    heartRateBpm: previousVitals?.heartRateBpm,
    respiratoryRateBpm: previousVitals?.respiratoryRateBpm,
    bloodPressureSystolic: previousVitals?.bloodPressureSystolic,
    bloodPressureDiastolic: previousVitals?.bloodPressureDiastolic,
    waistCircumferenceCm: previousVitals?.waistCircumferenceCm,
    notes: values.observations ?? previousVitals?.notes,
  };
};

const resolveCaptureVitalsErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return FALLBACK_CAPTURE_VITALS_ERROR_MESSAGE;
  }

  const domainCode = error.code as CaptureVitalsDomainErrorCode;
  if (domainCode in CAPTURE_VITALS_DOMAIN_ERROR_MESSAGE) {
    return CAPTURE_VITALS_DOMAIN_ERROR_MESSAGE[domainCode];
  }

  return error.message || FALLBACK_CAPTURE_VITALS_ERROR_MESSAGE;
};

interface MetricFieldProps {
  fieldId: string;
  label: string;
  unit: string;
  step?: number;
  disabled?: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
}

const MetricField = ({
  fieldId,
  label,
  unit,
  step,
  disabled,
  error,
  registration,
}: MetricFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
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
};

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

  const queueQuery = useSomatometriaQueue({
    enabled: canReadSomatometriaQueue,
  });
  const captureVitals = useCaptureVitals();

  const [selectedVisitIdState, setSelectedVisitIdState] = useState<
    number | null
  >(null);
  const [capturedBmi, setCapturedBmi] = useState<number | null>(null);

  const form = useForm<
    CaptureVitalsFormInput,
    unknown,
    CaptureVitalsFormValues
  >({
    resolver: zodResolver(captureVitalsFormSchema),
    mode: "onChange",
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const visits = queueQuery.data?.items ?? [];

  const selectedVisitId =
    selectedVisitIdState !== null &&
    visits.some((visit) => visit.id === selectedVisitIdState)
      ? selectedVisitIdState
      : (visits[0]?.id ?? null);

  const selectedVisit =
    visits.find((visit) => visit.id === selectedVisitId) ?? null;

  const canCaptureSelectedVisit = selectedVisit
    ? canCaptureSomatometriaVitals && canCaptureVitals(selectedVisit.status)
    : false;

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
    if (
      !selectedVisit ||
      !canCaptureSomatometriaVitals ||
      !canCaptureSelectedVisit
    ) {
      return;
    }

    try {
      const result = await captureVitals.mutateAsync({
        visitId: selectedVisit.id,
        data: buildCaptureVitalsPayload(values, selectedVisit.vitals),
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

  return (
    <section className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-txt-body">
          Somatometria
        </h1>
        <p className="text-sm text-txt-muted">
          Captura los signos vitales esenciales de la visita activa.
        </p>
      </header>

      {!canReadSomatometriaQueue ? (
        <p className="text-sm text-txt-muted" role="status">
          No tenes permisos completos para cargar la bandeja de somatometria.
        </p>
      ) : null}

      {canReadSomatometriaQueue && queueQuery.isLoading ? (
        <p className="text-sm text-txt-muted">
          Cargando bandeja de somatometria...
        </p>
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
        <p className="text-sm text-txt-muted">
          No hay pacientes en somatometria.
        </p>
      ) : null}

      {canReadSomatometriaQueue &&
      !queueQuery.isLoading &&
      !queueQuery.isError &&
      visits.length > 0 ? (
        <section className="space-y-5 rounded-xl border border-line-hairline bg-paper p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="visit-selector">Visita activa</Label>
              <Select
                value={selectedVisitId?.toString() ?? ""}
                onValueChange={(value) => {
                  handleVisitChange(Number(value));
                }}
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
                      {visit.folio} - {formatStatusLabel(visit.status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-txt-muted">Folio</p>
              <p className="text-sm font-medium text-txt-body">
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

          <form
            className="space-y-5"
            noValidate
            onSubmit={form.handleSubmit(handleCaptureVitals)}
          >
            <div className="grid gap-4 border-t border-line-hairline pt-4 md:grid-cols-2">
              <MetricField
                fieldId="heightCm"
                label="Estatura"
                unit="cm"
                step={0.1}
                disabled={!canCaptureSelectedVisit || captureVitals.isPending}
                error={form.formState.errors.heightCm?.message}
                registration={form.register("heightCm")}
              />
              <MetricField
                fieldId="weightKg"
                label="Peso"
                unit="kg"
                step={0.1}
                disabled={!canCaptureSelectedVisit || captureVitals.isPending}
                error={form.formState.errors.weightKg?.message}
                registration={form.register("weightKg")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bmi">IMC</Label>
                <div className="flex overflow-hidden rounded-2xl border border-line-struct bg-paper">
                  <Input
                    id="bmi"
                    data-testid="somato-bmi-input"
                    readOnly
                    value={visibleBmi !== null ? formatBmi(visibleBmi) : "--"}
                    className="rounded-none border-0 focus-visible:ring-0"
                  />
                  <span className="inline-flex min-w-20 items-center justify-center border-l border-line-hairline bg-subtle px-3 text-sm text-txt-muted">
                    kg/m2
                  </span>
                </div>
              </div>

              <MetricField
                fieldId="temperatureC"
                label="Temperatura"
                unit="C"
                step={0.1}
                disabled={!canCaptureSelectedVisit || captureVitals.isPending}
                error={form.formState.errors.temperatureC?.message}
                registration={form.register("temperatureC")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MetricField
                fieldId="oxygenSaturationPct"
                label="Saturacion de oxigeno"
                unit="%"
                disabled={!canCaptureSelectedVisit || captureVitals.isPending}
                error={form.formState.errors.oxygenSaturationPct?.message}
                registration={form.register("oxygenSaturationPct")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                data-testid="somato-observations-input"
                rows={3}
                disabled={!canCaptureSelectedVisit || captureVitals.isPending}
                placeholder="Opcional"
                {...form.register("observations")}
              />
              {form.formState.errors.observations?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.observations.message}
                </p>
              ) : null}
            </div>

            <div className="border-t border-line-hairline pt-4">
              <Button
                type="submit"
                data-testid="somato-save-button"
                className="w-full md:w-auto"
                disabled={!canCaptureSelectedVisit || captureVitals.isPending}
              >
                Guardar
              </Button>
            </div>

            {visibleBmi !== null ? (
              <p className="pt-3 text-sm text-txt-muted" role="status">
                IMC calculado: {formatBmi(visibleBmi)}
              </p>
            ) : null}
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
