import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VISIT_STATUS } from "@api/types";
import { VisitStageNavigator } from "@features/flujo-clinico/components/VisitStageNavigator";
import {
  VISIT_STAGE,
  canCaptureVitals,
} from "@features/flujo-clinico/domain/visit-flow.constants";
import {
  captureVitalsFormSchema,
  type CaptureVitalsFormInput,
  type CaptureVitalsFormValues,
} from "@features/flujo-clinico/domain/visit-flow.schemas";
import { useCaptureVitals } from "@features/flujo-clinico/mutations/useCaptureVitals";
import { useSomatometriaQueue } from "@features/flujo-clinico/queries/useSomatometriaQueue";

const DEFAULT_FORM_VALUES: CaptureVitalsFormInput = {
  weightKg: undefined,
  heightCm: undefined,
  temperatureC: undefined,
  oxygenSaturationPct: undefined,
  heartRateBpm: undefined,
  respiratoryRateBpm: undefined,
  bloodPressureSystolic: undefined,
  bloodPressureDiastolic: undefined,
  notes: "",
};

const formatStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ");
};

export const SomatometriaCapturePage = () => {
  const queueQuery = useSomatometriaQueue();
  const captureVitals = useCaptureVitals();
  const [selectedVisitIdState, setSelectedVisitIdState] = useState<
    number | null
  >(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const form = useForm<
    CaptureVitalsFormInput,
    unknown,
    CaptureVitalsFormValues
  >({
    resolver: zodResolver(captureVitalsFormSchema),
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
    ? canCaptureVitals(selectedVisit.status)
    : false;

  const handleCaptureVitals = async (values: CaptureVitalsFormValues) => {
    if (!selectedVisit || !canCaptureSelectedVisit) {
      return;
    }

    setFeedbackMessage(null);
    await captureVitals.mutateAsync({
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
        notes: values.notes,
      },
    });
    setFeedbackMessage("Signos vitales guardados correctamente.");
    form.reset(DEFAULT_FORM_VALUES);
  };

  const currentStatus = selectedVisit?.status ?? VISIT_STATUS.EN_SOMATOMETRIA;

  return (
    <section className="space-y-6 p-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-txt-body">
          Bandeja de somatometria
        </h1>
        <p className="text-sm text-txt-muted">
          Captura de vitales minimos y liberacion para doctor.
        </p>
        <VisitStageNavigator
          currentStatus={currentStatus}
          currentStage={VISIT_STAGE.SOMATOMETRIA}
        />
      </header>

      {queueQuery.isLoading ? (
        <p className="text-sm text-txt-muted">
          Cargando bandeja de somatometria...
        </p>
      ) : null}

      {queueQuery.isError ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>
            No se pudo cargar la bandeja de somatometria.
          </AlertDescription>
        </Alert>
      ) : null}

      {!queueQuery.isLoading && !queueQuery.isError && visits.length === 0 ? (
        <p className="text-sm text-txt-muted">
          No hay pacientes en somatometria.
        </p>
      ) : null}

      {!queueQuery.isLoading && !queueQuery.isError && visits.length > 0 ? (
        <section className="space-y-4 rounded-xl border border-line-struct bg-paper p-4">
          <div className="space-y-2">
            <Label htmlFor="visit-selector">Visita</Label>
            <select
              id="visit-selector"
              className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              value={selectedVisitId?.toString() ?? ""}
              onChange={(event) => {
                setSelectedVisitIdState(Number(event.target.value));
              }}
            >
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.folio} - {formatStatusLabel(visit.status)}
                </option>
              ))}
            </select>
          </div>

          <form
            className="grid gap-4 md:grid-cols-2"
            noValidate
            onSubmit={form.handleSubmit(handleCaptureVitals)}
          >
            <div className="space-y-2">
              <Label htmlFor="weightKg">Peso (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.1"
                {...form.register("weightKg")}
              />
              {form.formState.errors.weightKg?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.weightKg.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="heightCm">Talla (cm)</Label>
              <Input
                id="heightCm"
                type="number"
                step="0.1"
                {...form.register("heightCm")}
              />
              {form.formState.errors.heightCm?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.heightCm.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperatureC">Temperatura (C)</Label>
              <Input
                id="temperatureC"
                type="number"
                step="0.1"
                {...form.register("temperatureC")}
              />
              {form.formState.errors.temperatureC?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.temperatureC.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="oxygenSaturationPct">Saturacion O2 (%)</Label>
              <Input
                id="oxygenSaturationPct"
                type="number"
                {...form.register("oxygenSaturationPct")}
              />
              {form.formState.errors.oxygenSaturationPct?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.oxygenSaturationPct.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="heartRateBpm">
                Frecuencia cardiaca (opcional)
              </Label>
              <Input
                id="heartRateBpm"
                type="number"
                {...form.register("heartRateBpm")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="respiratoryRateBpm">
                Frecuencia respiratoria (opcional)
              </Label>
              <Input
                id="respiratoryRateBpm"
                type="number"
                {...form.register("respiratoryRateBpm")}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={3} {...form.register("notes")} />
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={!canCaptureSelectedVisit || captureVitals.isPending}
              >
                Guardar vitales
              </Button>
            </div>
          </form>

          {!canCaptureSelectedVisit ? (
            <p className="text-sm text-status-alert" role="status">
              Selecciona una visita en somatometria para capturar vitales.
            </p>
          ) : null}

          {feedbackMessage ? (
            <p className="text-sm text-status-info" role="status">
              {feedbackMessage}
            </p>
          ) : null}
        </section>
      ) : null}
    </section>
  );
};

export default SomatometriaCapturePage;
