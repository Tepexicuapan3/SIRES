import { useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@api/utils/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";
import { VISIT_STATUS } from "@api/types";
import { canCaptureVitals } from "@features/operativo/shared/domain/visit-flow.constants";
import {
  captureVitalsFormSchema,
  type CaptureVitalsFormInput,
  type CaptureVitalsFormValues,
} from "@features/somatometria/modules/captura/domain/capture-vitals.schemas";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
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
  weightKg: undefined,
  heightCm: undefined,
  temperatureC: undefined,
  oxygenSaturationPct: undefined,
  heartRateBpm: undefined,
  respiratoryRateBpm: undefined,
  bloodPressureSystolic: undefined,
  bloodPressureDiastolic: undefined,
  waistCircumferenceCm: undefined,
  notes: "",
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

  const handleVisitChange = (nextVisitId: number) => {
    setSelectedVisitIdState(nextVisitId);
    setCapturedBmi(null);
    form.reset(DEFAULT_FORM_VALUES);
  };

  const handleCancel = () => {
    form.reset(DEFAULT_FORM_VALUES);
    setCapturedBmi(null);
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
        data: {
          weightKg: values.weightKg,
          heightCm: values.heightCm,
          temperatureC: values.temperatureC,
          oxygenSaturationPct: values.oxygenSaturationPct,
          heartRateBpm: values.heartRateBpm,
          respiratoryRateBpm: values.respiratoryRateBpm,
          bloodPressureSystolic: values.bloodPressureSystolic,
          bloodPressureDiastolic: values.bloodPressureDiastolic,
          waistCircumferenceCm: values.waistCircumferenceCm,
          notes: values.notes,
        },
      });

      setCapturedBmi(result.vitals.bmi);
      toast.success("Signos vitales guardados correctamente.", {
        description: `Visita ${selectedVisit.folio} actualizada.`,
      });
      form.reset(DEFAULT_FORM_VALUES);
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
          Captura vitales criticos y guarda la visita activa.
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
                <SelectTrigger id="visit-selector" className="w-full">
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
              <p className="text-xs text-txt-muted">Ficha</p>
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
              <div className="space-y-2 rounded-xl border border-line-hairline bg-subtle/50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-txt-muted">
                  Guardado
                </p>
                <p className="text-sm text-txt-body">
                  {canCaptureSelectedVisit
                    ? "La visita quedara lista para Doctor al guardar."
                    : "Selecciona una visita en somatometria para habilitar guardado."}
                </p>
              </div>
            </div>

            <div className="border-t border-line-hairline pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={!canCaptureSelectedVisit || captureVitals.isPending}
              >
                Guardar
              </Button>
            </div>

            <Collapsible
              defaultOpen={false}
              className="space-y-3 border-t border-line-hairline pt-4"
            >
              <CollapsibleTrigger className="group/collapsible flex w-full items-center justify-between rounded-lg border border-line-struct px-3 py-2 text-left text-sm font-medium text-txt-body">
                Campos opcionales y tips
                <ChevronDownIcon className="size-4 text-txt-muted transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <p className="rounded-xl border border-line-hairline bg-subtle/40 px-3 py-2 text-sm text-txt-muted">
                  Completa estos datos solo cuando aporten contexto clinico
                  adicional.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="bloodPressureSystolic">
                    Presion arterial
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="bloodPressureSystolic"
                      type="number"
                      disabled={
                        !canCaptureSelectedVisit || captureVitals.isPending
                      }
                      placeholder="---"
                      {...form.register("bloodPressureSystolic")}
                    />
                    <span className="text-sm text-txt-muted">/</span>
                    <Input
                      id="bloodPressureDiastolic"
                      type="number"
                      disabled={
                        !canCaptureSelectedVisit || captureVitals.isPending
                      }
                      placeholder="---"
                      {...form.register("bloodPressureDiastolic")}
                    />
                    <span className="text-sm text-txt-muted">mmHg</span>
                  </div>
                  {form.formState.errors.bloodPressureSystolic?.message ? (
                    <p className="text-sm text-status-critical" role="alert">
                      {form.formState.errors.bloodPressureSystolic.message}
                    </p>
                  ) : null}
                  {form.formState.errors.bloodPressureDiastolic?.message ? (
                    <p className="text-sm text-status-critical" role="alert">
                      {form.formState.errors.bloodPressureDiastolic.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <MetricField
                    fieldId="heartRateBpm"
                    label="Frecuencia cardiaca"
                    unit="lat/min"
                    disabled={
                      !canCaptureSelectedVisit || captureVitals.isPending
                    }
                    error={form.formState.errors.heartRateBpm?.message}
                    registration={form.register("heartRateBpm")}
                  />
                  <MetricField
                    fieldId="respiratoryRateBpm"
                    label="Frecuencia respiratoria"
                    unit="resp/min"
                    disabled={
                      !canCaptureSelectedVisit || captureVitals.isPending
                    }
                    error={form.formState.errors.respiratoryRateBpm?.message}
                    registration={form.register("respiratoryRateBpm")}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <MetricField
                    fieldId="waistCircumferenceCm"
                    label="Circunferencia abdominal"
                    unit="cm"
                    disabled={
                      !canCaptureSelectedVisit || captureVitals.isPending
                    }
                    error={form.formState.errors.waistCircumferenceCm?.message}
                    registration={form.register("waistCircumferenceCm")}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observaciones</Label>
                    <Textarea
                      id="notes"
                      rows={4}
                      disabled={
                        !canCaptureSelectedVisit || captureVitals.isPending
                      }
                      placeholder="Notas clinicas breves"
                      {...form.register("notes")}
                    />
                    {form.formState.errors.notes?.message ? (
                      <p className="text-sm text-status-critical" role="alert">
                        {form.formState.errors.notes.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end border-t border-line-hairline pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={captureVitals.isPending}
              >
                Limpiar formulario
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
