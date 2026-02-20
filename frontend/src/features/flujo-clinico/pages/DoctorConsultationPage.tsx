import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VISIT_STATUS, type VisitStatus } from "@api/types";
import { VisitStageNavigator } from "@features/flujo-clinico/components/VisitStageNavigator";
import {
  VISIT_STAGE,
  canCloseConsultation,
  canStartConsultation,
} from "@features/flujo-clinico/domain/visit-flow.constants";
import {
  closeVisitFormSchema,
  type CloseVisitFormInput,
  type CloseVisitFormValues,
} from "@features/flujo-clinico/domain/visit-flow.schemas";
import { useCloseVisit } from "@features/flujo-clinico/mutations/useCloseVisit";
import { useStartConsultation } from "@features/flujo-clinico/mutations/useStartConsultation";
import { useDoctorQueue } from "@features/flujo-clinico/queries/useDoctorQueue";

const DEFAULT_FORM_VALUES: CloseVisitFormInput = {
  primaryDiagnosis: "",
  finalNote: "",
};

const formatStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ");
};

export const DoctorConsultationPage = () => {
  const queueQuery = useDoctorQueue();
  const startConsultation = useStartConsultation();
  const closeVisit = useCloseVisit();
  const [selectedVisitIdState, setSelectedVisitIdState] = useState<
    number | null
  >(null);
  const [localStatusesByVisitId, setLocalStatusesByVisitId] = useState<
    Record<number, VisitStatus>
  >({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const form = useForm<CloseVisitFormInput, unknown, CloseVisitFormValues>({
    resolver: zodResolver(closeVisitFormSchema),
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

  const getEffectiveStatus = (
    visitId: number,
    baseStatus: VisitStatus,
  ): VisitStatus => {
    return localStatusesByVisitId[visitId] ?? baseStatus;
  };

  const selectedVisitStatus = selectedVisit
    ? getEffectiveStatus(selectedVisit.id, selectedVisit.status)
    : VISIT_STATUS.LISTA_PARA_DOCTOR;

  const canStartSelectedVisit = selectedVisit
    ? canStartConsultation(selectedVisitStatus)
    : false;

  const canCloseSelectedVisit = selectedVisit
    ? canCloseConsultation(selectedVisitStatus)
    : false;

  const handleStartConsultation = async () => {
    if (!selectedVisit || !canStartSelectedVisit) {
      return;
    }

    setFeedbackMessage(null);

    const result = await startConsultation.mutateAsync({
      visitId: selectedVisit.id,
    });

    setLocalStatusesByVisitId((current) => ({
      ...current,
      [selectedVisit.id]: result.status,
    }));
    setFeedbackMessage("Consulta iniciada.");
  };

  const handleCloseVisit = async (values: CloseVisitFormValues) => {
    if (!selectedVisit || !canCloseSelectedVisit) {
      return;
    }

    setFeedbackMessage(null);
    await closeVisit.mutateAsync({
      visitId: selectedVisit.id,
      data: {
        primaryDiagnosis: values.primaryDiagnosis,
        finalNote: values.finalNote,
      },
    });

    setLocalStatusesByVisitId((current) => ({
      ...current,
      [selectedVisit.id]: VISIT_STATUS.CERRADA,
    }));
    setFeedbackMessage("Consulta cerrada correctamente.");
    form.reset(DEFAULT_FORM_VALUES);
  };

  return (
    <section className="space-y-6 p-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-txt-body">
          Bandeja del doctor
        </h1>
        <p className="text-sm text-txt-muted">
          Inicia consulta, registra diagnostico y cierra atencion.
        </p>
        <VisitStageNavigator
          currentStatus={selectedVisitStatus}
          currentStage={VISIT_STAGE.DOCTOR}
        />
      </header>

      {queueQuery.isLoading ? (
        <p className="text-sm text-txt-muted">Cargando bandeja del doctor...</p>
      ) : null}

      {queueQuery.isError ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>
            No se pudo cargar la bandeja del doctor.
          </AlertDescription>
        </Alert>
      ) : null}

      {!queueQuery.isLoading && !queueQuery.isError && visits.length === 0 ? (
        <p className="text-sm text-txt-muted">
          No hay pacientes listos para doctor.
        </p>
      ) : null}

      {!queueQuery.isLoading && !queueQuery.isError && visits.length > 0 ? (
        <section className="space-y-4 rounded-xl border border-line-struct bg-paper p-4">
          <div className="space-y-2">
            <Label htmlFor="doctor-visit-selector">Visita</Label>
            <select
              id="doctor-visit-selector"
              className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              value={selectedVisitId?.toString() ?? ""}
              onChange={(event) => {
                setSelectedVisitIdState(Number(event.target.value));
              }}
            >
              {visits.map((visit) => {
                const status = getEffectiveStatus(visit.id, visit.status);

                return (
                  <option key={visit.id} value={visit.id}>
                    {visit.folio} - {formatStatusLabel(status)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canStartSelectedVisit || startConsultation.isPending}
              onClick={() => {
                void handleStartConsultation();
              }}
            >
              Iniciar consulta
            </Button>
          </div>

          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(handleCloseVisit)}
          >
            <div className="space-y-2">
              <Label htmlFor="primaryDiagnosis">Diagnostico principal</Label>
              <Textarea
                id="primaryDiagnosis"
                rows={3}
                {...form.register("primaryDiagnosis")}
              />
              {form.formState.errors.primaryDiagnosis?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.primaryDiagnosis.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalNote">Nota final</Label>
              <Textarea
                id="finalNote"
                rows={4}
                {...form.register("finalNote")}
              />
              {form.formState.errors.finalNote?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.finalNote.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={
                !canCloseSelectedVisit ||
                !form.formState.isValid ||
                closeVisit.isPending
              }
            >
              Cerrar consulta
            </Button>
          </form>

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

export default DoctorConsultationPage;
