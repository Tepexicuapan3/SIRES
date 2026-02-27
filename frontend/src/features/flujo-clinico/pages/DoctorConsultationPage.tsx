import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@api/utils/errors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VISIT_STATUS, type VisitStatus } from "@api/types";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
import {
  VisitTimelinePanel,
  type VisitTimelineEntry,
} from "@features/flujo-clinico/components/VisitTimelinePanel";
import { VisitStageNavigator } from "@features/flujo-clinico/components/VisitStageNavigator";
import {
  VISIT_STAGE,
  canCloseConsultation,
  canStartConsultation,
} from "@features/flujo-clinico/domain/visit-flow.constants";
import {
  saveDiagnosisFormSchema,
  savePrescriptionsFormSchema,
  type SaveDiagnosisFormInput,
  type SaveDiagnosisFormValues,
  type SavePrescriptionsFormInput,
  type SavePrescriptionsFormValues,
} from "@features/flujo-clinico/domain/visit-flow.schemas";
import { useCloseVisit } from "@features/flujo-clinico/mutations/useCloseVisit";
import { useSaveDiagnosis } from "@features/flujo-clinico/mutations/useSaveDiagnosis";
import { useSavePrescriptions } from "@features/flujo-clinico/mutations/useSavePrescriptions";
import { useStartConsultation } from "@features/flujo-clinico/mutations/useStartConsultation";
import { useDoctorQueue } from "@features/flujo-clinico/queries/useDoctorQueue";

const DOCTOR_QUEUE_PERMISSION_REQUIREMENT = {
  allOf: ["clinico:consultas:read"],
} as const;

const DOCTOR_WRITE_PERMISSION_REQUIREMENT = {
  allOf: ["clinico:consultas:read"],
} as const;

const START_CONSULTATION_DOMAIN_ERROR_MESSAGE: Record<
  | "ROLE_NOT_ALLOWED"
  | "VISIT_STATE_INVALID"
  | "VISIT_NOT_FOUND"
  | "PERMISSION_DENIED",
  string
> = {
  ROLE_NOT_ALLOWED: "No tenes permiso para iniciar consulta.",
  VISIT_STATE_INVALID:
    "La visita ya no esta en un estado valido para iniciar consulta.",
  VISIT_NOT_FOUND: "La visita ya no existe o fue actualizada por otro usuario.",
  PERMISSION_DENIED: "No tenes permiso para ejecutar esta accion.",
};

const SAVE_DIAGNOSIS_DOMAIN_ERROR_MESSAGE: Record<
  | "ROLE_NOT_ALLOWED"
  | "VISIT_STATE_INVALID"
  | "VISIT_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "PERMISSION_DENIED",
  string
> = {
  ROLE_NOT_ALLOWED: "No tenes permiso para guardar diagnostico.",
  VISIT_STATE_INVALID:
    "La visita ya no esta en consulta. Actualiza la bandeja del doctor.",
  VISIT_NOT_FOUND: "La visita ya no existe o fue cerrada por otro usuario.",
  VALIDATION_ERROR: "Revisa los campos del diagnostico antes de guardar.",
  PERMISSION_DENIED: "No tenes permiso para ejecutar esta accion.",
};

const SAVE_PRESCRIPTIONS_DOMAIN_ERROR_MESSAGE: Record<
  | "ROLE_NOT_ALLOWED"
  | "VISIT_STATE_INVALID"
  | "VISIT_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "PERMISSION_DENIED",
  string
> = {
  ROLE_NOT_ALLOWED: "No tenes permiso para guardar receta.",
  VISIT_STATE_INVALID:
    "La visita ya no esta en consulta. Actualiza la bandeja del doctor.",
  VISIT_NOT_FOUND: "La visita ya no existe o fue cerrada por otro usuario.",
  VALIDATION_ERROR: "Agrega al menos una indicacion valida de receta.",
  PERMISSION_DENIED: "No tenes permiso para ejecutar esta accion.",
};

const CLOSE_CONSULTATION_DOMAIN_ERROR_MESSAGE: Record<
  | "ROLE_NOT_ALLOWED"
  | "VISIT_STATE_INVALID"
  | "VISIT_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "PERMISSION_DENIED"
  | "CONFLICT_DUPLICATE_ACTION",
  string
> = {
  ROLE_NOT_ALLOWED: "No tenes permiso para cerrar consulta.",
  VISIT_STATE_INVALID:
    "La visita ya no esta en un estado valido para cerrar consulta.",
  VISIT_NOT_FOUND: "La visita ya no existe o fue cerrada por otro usuario.",
  VALIDATION_ERROR:
    "Completa diagnostico y nota final para cerrar la consulta.",
  PERMISSION_DENIED: "No tenes permiso para ejecutar esta accion.",
  CONFLICT_DUPLICATE_ACTION:
    "La consulta ya fue cerrada con informacion diferente. Actualiza la bandeja.",
};

const FALLBACK_START_CONSULTATION_ERROR_MESSAGE =
  "No se pudo iniciar la consulta. Intenta nuevamente.";
const FALLBACK_SAVE_DIAGNOSIS_ERROR_MESSAGE =
  "No se pudo guardar el diagnostico. Intenta nuevamente.";
const FALLBACK_SAVE_PRESCRIPTIONS_ERROR_MESSAGE =
  "No se pudo guardar la receta. Intenta nuevamente.";
const FALLBACK_CLOSE_CONSULTATION_ERROR_MESSAGE =
  "No se pudo cerrar la consulta. Intenta nuevamente.";

const DEFAULT_DIAGNOSIS_FORM_VALUES: SaveDiagnosisFormInput = {
  primaryDiagnosis: "",
  finalNote: "",
};

const DEFAULT_PRESCRIPTIONS_FORM_VALUES: SavePrescriptionsFormInput = {
  itemsText: "",
};

interface FeedbackState {
  kind: "success" | "error";
  message: string;
}

interface VisitStatusOverrideState {
  visitId: number;
  status: VisitStatus;
}

const formatStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ");
};

const resolveDomainErrorMessage = <TDomainCode extends string>(
  error: unknown,
  domainErrors: Record<TDomainCode, string>,
  fallback: string,
): string => {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  const domainCode = error.code as TDomainCode;
  if (Object.prototype.hasOwnProperty.call(domainErrors, domainCode)) {
    return domainErrors[domainCode];
  }

  return error.message || fallback;
};

const toPrescriptionItems = (itemsText: string): string[] => {
  return itemsText
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const buildDiagnosisFingerprint = ({
  primaryDiagnosis,
  finalNote,
}: SaveDiagnosisFormValues): string => {
  return `${primaryDiagnosis.trim()}::${finalNote.trim()}`;
};

const createTimelineEntry = (
  title: string,
  description?: string,
): VisitTimelineEntry => {
  const createdAt = new Date().toISOString();

  return {
    id: `${createdAt}-${Math.random().toString(36).slice(2)}`,
    title,
    description,
    createdAt,
  };
};

export const DoctorConsultationPage = () => {
  const { hasCapability } = usePermissionDependencies();
  const canReadDoctorQueue = hasCapability(
    "flow.doctor.queue.read",
    DOCTOR_QUEUE_PERMISSION_REQUIREMENT,
  );
  const canStartDoctorConsultation = hasCapability(
    "flow.doctor.consultation.start",
    DOCTOR_WRITE_PERMISSION_REQUIREMENT,
  );
  const canCloseDoctorConsultation = hasCapability(
    "flow.doctor.consultation.close",
    DOCTOR_WRITE_PERMISSION_REQUIREMENT,
  );
  const canWriteDoctorConsultation =
    canStartDoctorConsultation && canCloseDoctorConsultation;

  const queueQuery = useDoctorQueue({ enabled: canReadDoctorQueue });
  const startConsultation = useStartConsultation();
  const saveDiagnosis = useSaveDiagnosis();
  const savePrescriptions = useSavePrescriptions();
  const closeVisit = useCloseVisit();
  const [selectedVisitIdState, setSelectedVisitIdState] = useState<
    number | null
  >(null);
  const [selectedVisitStatusOverride, setSelectedVisitStatusOverride] =
    useState<VisitStatusOverrideState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [timelineEntriesByVisitId, setTimelineEntriesByVisitId] = useState<
    Record<number, VisitTimelineEntry[]>
  >({});
  const [
    savedDiagnosisFingerprintByVisitId,
    setSavedDiagnosisFingerprintByVisitId,
  ] = useState<Record<number, string>>({});

  const diagnosisForm = useForm<
    SaveDiagnosisFormInput,
    unknown,
    SaveDiagnosisFormValues
  >({
    resolver: zodResolver(saveDiagnosisFormSchema),
    mode: "onChange",
    defaultValues: DEFAULT_DIAGNOSIS_FORM_VALUES,
  });

  const prescriptionsForm = useForm<
    SavePrescriptionsFormInput,
    unknown,
    SavePrescriptionsFormValues
  >({
    resolver: zodResolver(savePrescriptionsFormSchema),
    mode: "onChange",
    defaultValues: DEFAULT_PRESCRIPTIONS_FORM_VALUES,
  });

  const visits = queueQuery.data?.items ?? [];

  const selectedVisitId =
    selectedVisitIdState !== null &&
    visits.some((visit) => visit.id === selectedVisitIdState)
      ? selectedVisitIdState
      : (visits[0]?.id ?? null);

  const selectedVisit =
    visits.find((visit) => visit.id === selectedVisitId) ?? null;

  const selectedVisitStatusOverrideValue =
    selectedVisit &&
    selectedVisitStatusOverride?.visitId === selectedVisit.id &&
    selectedVisitStatusOverride.status !== selectedVisit.status
      ? selectedVisitStatusOverride.status
      : null;

  const selectedVisitStatus = selectedVisit
    ? (selectedVisitStatusOverrideValue ?? selectedVisit.status)
    : VISIT_STATUS.LISTA_PARA_DOCTOR;

  const canStartSelectedVisit =
    Boolean(selectedVisit) &&
    canStartDoctorConsultation &&
    canStartConsultation(selectedVisitStatus);

  const canSaveClinicalData =
    Boolean(selectedVisit) &&
    canCloseDoctorConsultation &&
    selectedVisitStatus === VISIT_STATUS.EN_CONSULTA;

  const canCloseSelectedVisit =
    Boolean(selectedVisit) &&
    canCloseDoctorConsultation &&
    canCloseConsultation(selectedVisitStatus);

  const selectedTimelineEntries = selectedVisit
    ? (timelineEntriesByVisitId[selectedVisit.id] ?? [])
    : [];

  const appendTimelineEntry = (
    visitId: number,
    title: string,
    description?: string,
  ) => {
    setTimelineEntriesByVisitId((current) => {
      const currentEntries = current[visitId] ?? [];
      const entry = createTimelineEntry(title, description);

      return {
        ...current,
        [visitId]: [entry, ...currentEntries].slice(0, 20),
      };
    });
  };

  const handleStartConsultation = async () => {
    if (!selectedVisit || !canStartSelectedVisit) {
      return;
    }

    setFeedback(null);

    try {
      const result = await startConsultation.mutateAsync({
        visitId: selectedVisit.id,
      });

      setSelectedVisitStatusOverride({
        visitId: selectedVisit.id,
        status: result.status,
      });
      appendTimelineEntry(
        selectedVisit.id,
        "Consulta iniciada",
        `La visita ${selectedVisit.folio} paso a ${formatStatusLabel(result.status)}.`,
      );
      setFeedback({ kind: "success", message: "Consulta iniciada." });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: resolveDomainErrorMessage(
          error,
          START_CONSULTATION_DOMAIN_ERROR_MESSAGE,
          FALLBACK_START_CONSULTATION_ERROR_MESSAGE,
        ),
      });
    }
  };

  const handleSaveDiagnosis = async (values: SaveDiagnosisFormValues) => {
    if (!selectedVisit || !canSaveClinicalData) {
      return;
    }

    setFeedback(null);

    try {
      const result = await saveDiagnosis.mutateAsync({
        visitId: selectedVisit.id,
        data: {
          primaryDiagnosis: values.primaryDiagnosis,
          finalNote: values.finalNote,
        },
      });

      setSavedDiagnosisFingerprintByVisitId((current) => ({
        ...current,
        [selectedVisit.id]: buildDiagnosisFingerprint(values),
      }));
      appendTimelineEntry(
        selectedVisit.id,
        "Diagnostico guardado",
        `${result.primaryDiagnosis}.`,
      );
      setFeedback({
        kind: "success",
        message: "Diagnostico guardado correctamente.",
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: resolveDomainErrorMessage(
          error,
          SAVE_DIAGNOSIS_DOMAIN_ERROR_MESSAGE,
          FALLBACK_SAVE_DIAGNOSIS_ERROR_MESSAGE,
        ),
      });
    }
  };

  const handleSavePrescriptions = async (
    values: SavePrescriptionsFormValues,
  ) => {
    if (!selectedVisit || !canSaveClinicalData) {
      return;
    }

    setFeedback(null);

    const items = toPrescriptionItems(values.itemsText);

    try {
      const result = await savePrescriptions.mutateAsync({
        visitId: selectedVisit.id,
        data: { items },
      });

      appendTimelineEntry(
        selectedVisit.id,
        "Receta guardada",
        `${result.items.length} indicacion(es) registradas.`,
      );
      setFeedback({
        kind: "success",
        message: "Receta guardada correctamente.",
      });
      prescriptionsForm.reset(DEFAULT_PRESCRIPTIONS_FORM_VALUES);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: resolveDomainErrorMessage(
          error,
          SAVE_PRESCRIPTIONS_DOMAIN_ERROR_MESSAGE,
          FALLBACK_SAVE_PRESCRIPTIONS_ERROR_MESSAGE,
        ),
      });
    }
  };

  const handleCloseVisit = async (values: SaveDiagnosisFormValues) => {
    if (!selectedVisit || !canCloseSelectedVisit) {
      return;
    }

    setFeedback(null);

    const diagnosisFingerprint = buildDiagnosisFingerprint(values);
    const hasMatchingSavedDiagnosis =
      savedDiagnosisFingerprintByVisitId[selectedVisit.id] ===
      diagnosisFingerprint;

    try {
      if (!hasMatchingSavedDiagnosis) {
        await saveDiagnosis.mutateAsync({
          visitId: selectedVisit.id,
          data: {
            primaryDiagnosis: values.primaryDiagnosis,
            finalNote: values.finalNote,
          },
        });

        setSavedDiagnosisFingerprintByVisitId((current) => ({
          ...current,
          [selectedVisit.id]: diagnosisFingerprint,
        }));
        appendTimelineEntry(
          selectedVisit.id,
          "Diagnostico sincronizado",
          "Se guardo diagnostico antes del cierre clinico.",
        );
      }

      await closeVisit.mutateAsync({
        visitId: selectedVisit.id,
        data: {
          primaryDiagnosis: values.primaryDiagnosis,
          finalNote: values.finalNote,
        },
      });

      setSelectedVisitStatusOverride({
        visitId: selectedVisit.id,
        status: VISIT_STATUS.CERRADA,
      });
      appendTimelineEntry(
        selectedVisit.id,
        "Consulta cerrada",
        `La visita ${selectedVisit.folio} se cerro correctamente.`,
      );
      setFeedback({
        kind: "success",
        message: "Consulta cerrada correctamente.",
      });
      diagnosisForm.reset(DEFAULT_DIAGNOSIS_FORM_VALUES);
      prescriptionsForm.reset(DEFAULT_PRESCRIPTIONS_FORM_VALUES);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: resolveDomainErrorMessage(
          error,
          CLOSE_CONSULTATION_DOMAIN_ERROR_MESSAGE,
          FALLBACK_CLOSE_CONSULTATION_ERROR_MESSAGE,
        ),
      });
    }
  };

  return (
    <section className="space-y-6 p-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-txt-body">
          Bandeja del doctor
        </h1>
        <p className="text-sm text-txt-muted">
          Inicia consulta, registra diagnostico y receta, y cierra atencion.
        </p>
        <VisitStageNavigator
          currentStatus={selectedVisitStatus}
          currentStage={VISIT_STAGE.DOCTOR}
        />
      </header>

      {!canReadDoctorQueue ? (
        <p className="text-sm text-txt-muted" role="status">
          No tenes permisos completos para cargar la bandeja del doctor.
        </p>
      ) : null}

      {canReadDoctorQueue && queueQuery.isLoading ? (
        <p className="text-sm text-txt-muted">Cargando bandeja del doctor...</p>
      ) : null}

      {canReadDoctorQueue && queueQuery.isError ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>
            No se pudo cargar la bandeja del doctor.
          </AlertDescription>
        </Alert>
      ) : null}

      {canReadDoctorQueue &&
      !queueQuery.isLoading &&
      !queueQuery.isError &&
      visits.length === 0 ? (
        <p className="text-sm text-txt-muted">
          No hay pacientes listos para doctor.
        </p>
      ) : null}

      {canReadDoctorQueue &&
      !queueQuery.isLoading &&
      !queueQuery.isError &&
      visits.length > 0 ? (
        <section className="space-y-4 rounded-xl border border-line-struct bg-paper p-4">
          {!canWriteDoctorConsultation ? (
            <p className="text-sm text-txt-muted" role="status">
              No tenes permisos completos para registrar diagnostico, receta o
              cierre de consulta.
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="doctor-visit-selector">Visita</Label>
            <select
              id="doctor-visit-selector"
              className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              value={selectedVisitId?.toString() ?? ""}
              onChange={(event) => {
                setSelectedVisitIdState(Number(event.target.value));
                setSelectedVisitStatusOverride(null);
                setFeedback(null);
              }}
            >
              {visits.map((visit) => {
                const status =
                  visit.id === selectedVisit?.id
                    ? selectedVisitStatus
                    : visit.status;

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
              disabled={
                !canStartSelectedVisit ||
                startConsultation.isPending ||
                saveDiagnosis.isPending ||
                closeVisit.isPending
              }
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
            onSubmit={diagnosisForm.handleSubmit(handleCloseVisit)}
          >
            <div className="space-y-2">
              <Label htmlFor="primaryDiagnosis">Diagnostico principal</Label>
              <Textarea
                id="primaryDiagnosis"
                rows={3}
                disabled={!canSaveClinicalData || saveDiagnosis.isPending}
                {...diagnosisForm.register("primaryDiagnosis")}
              />
              {diagnosisForm.formState.errors.primaryDiagnosis?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {diagnosisForm.formState.errors.primaryDiagnosis.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalNote">Nota final</Label>
              <Textarea
                id="finalNote"
                rows={4}
                disabled={!canSaveClinicalData || saveDiagnosis.isPending}
                {...diagnosisForm.register("finalNote")}
              />
              {diagnosisForm.formState.errors.finalNote?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {diagnosisForm.formState.errors.finalNote.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  !canSaveClinicalData ||
                  !diagnosisForm.formState.isValid ||
                  saveDiagnosis.isPending ||
                  closeVisit.isPending
                }
                onClick={() => {
                  void diagnosisForm.handleSubmit(handleSaveDiagnosis)();
                }}
              >
                Guardar diagnostico
              </Button>

              <Button
                type="submit"
                disabled={
                  !canCloseSelectedVisit ||
                  !diagnosisForm.formState.isValid ||
                  closeVisit.isPending ||
                  saveDiagnosis.isPending
                }
              >
                Cerrar consulta
              </Button>
            </div>
          </form>

          <form
            className="space-y-2"
            noValidate
            onSubmit={prescriptionsForm.handleSubmit(handleSavePrescriptions)}
          >
            <Label htmlFor="prescriptions">
              Receta (una indicacion por linea)
            </Label>
            <Textarea
              id="prescriptions"
              rows={4}
              disabled={!canSaveClinicalData || savePrescriptions.isPending}
              {...prescriptionsForm.register("itemsText")}
            />
            {prescriptionsForm.formState.errors.itemsText?.message ? (
              <p className="text-sm text-status-critical" role="alert">
                {prescriptionsForm.formState.errors.itemsText.message}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="outline"
              disabled={
                !canSaveClinicalData ||
                !prescriptionsForm.formState.isValid ||
                savePrescriptions.isPending
              }
            >
              Guardar receta
            </Button>
          </form>

          {feedback ? (
            <Alert variant={feedback.kind === "error" ? "warning" : "success"}>
              <AlertTitle>
                {feedback.kind === "error" ? "No se pudo completar" : "Listo"}
              </AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          ) : null}

          <VisitTimelinePanel entries={selectedTimelineEntries} />
        </section>
      ) : null}
    </section>
  );
};

export default DoctorConsultationPage;
