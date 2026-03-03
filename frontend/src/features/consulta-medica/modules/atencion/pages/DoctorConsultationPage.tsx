import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@api/utils/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDownIcon } from "lucide-react";
import { VISIT_SERVICE, VISIT_STATUS, type VisitStatus } from "@api/types";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
import {
  VisitTimelinePanel,
  type VisitTimelineEntry,
} from "@features/operativo/shared/components/VisitTimelinePanel";
import {
  canCloseConsultation,
  canStartConsultation,
} from "@features/operativo/shared/domain/visit-flow.constants";
import {
  saveDiagnosisFormSchema,
  savePrescriptionsFormSchema,
  type SaveDiagnosisFormInput,
  type SaveDiagnosisFormValues,
  type SavePrescriptionsFormInput,
  type SavePrescriptionsFormValues,
} from "@features/consulta-medica/modules/atencion/domain/consultation.schemas";
import { useCloseVisit } from "@features/consulta-medica/modules/atencion/mutations/useCloseVisit";
import { useSaveDiagnosis } from "@features/consulta-medica/modules/atencion/mutations/useSaveDiagnosis";
import { useSavePrescriptions } from "@features/consulta-medica/modules/atencion/mutations/useSavePrescriptions";
import { useStartConsultation } from "@features/consulta-medica/modules/atencion/mutations/useStartConsultation";
import { useDoctorQueue } from "@features/consulta-medica/modules/atencion/queries/useDoctorQueue";

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

const SERVICE_TYPE_LABEL: Record<string, string> = {
  [VISIT_SERVICE.MEDICINA_GENERAL]: "Medicina general",
  [VISIT_SERVICE.ESPECIALIDAD]: "Especialidad",
  [VISIT_SERVICE.URGENCIAS]: "Urgencias",
};

const ARRIVAL_LABEL: Record<string, string> = {
  appointment: "Con cita",
  walk_in: "Sin cita",
};

const DOCTOR_TAB = {
  MOTIVO: "motivo",
  VITALES: "vitales",
  EXPLORACION: "exploracion",
  DIAGNOSTICO: "diagnostico",
  RECETA: "receta",
} as const;

type DoctorTab = (typeof DOCTOR_TAB)[keyof typeof DOCTOR_TAB];

const DEFAULT_DIAGNOSIS_FORM_VALUES: SaveDiagnosisFormInput = {
  primaryDiagnosis: "",
  finalNote: "",
};

const DEFAULT_PRESCRIPTIONS_FORM_VALUES: SavePrescriptionsFormInput = {
  itemsText: "",
};

const DEFAULT_EXPLORATION_NOTE = "";

interface VisitStatusOverrideState {
  visitId: number;
  status: VisitStatus;
}

interface VitalMetricCardProps {
  label: string;
  value: string;
  unit?: string;
  helper?: string;
}

const VitalMetricCard = ({
  label,
  value,
  unit,
  helper,
}: VitalMetricCardProps) => {
  return (
    <article className="rounded-xl border border-line-struct bg-paper p-4">
      <p className="text-sm font-medium text-txt-muted">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-3xl font-semibold tracking-tight text-txt-body">
          {value}
        </p>
        {unit ? (
          <span className="pb-1 text-sm text-txt-muted">{unit}</span>
        ) : null}
      </div>
      {helper ? <p className="mt-1 text-sm text-txt-muted">{helper}</p> : null}
    </article>
  );
};

const formatStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ");
};

const formatServiceTypeLabel = (serviceType: string): string => {
  return SERVICE_TYPE_LABEL[serviceType] ?? serviceType;
};

const formatArrivalTypeLabel = (arrivalType: string): string => {
  return ARRIVAL_LABEL[arrivalType] ?? arrivalType;
};

const formatOptionalMetric = (
  value: number | null | undefined,
  options: {
    digits?: number;
  } = {},
): string => {
  if (value === null || value === undefined) {
    return "--";
  }

  const digits = options.digits ?? 0;
  return digits > 0 ? value.toFixed(digits) : value.toString();
};

const formatHeightMeters = (heightCm: number | null | undefined): string => {
  if (heightCm === null || heightCm === undefined) {
    return "--";
  }

  return (heightCm / 100).toFixed(2);
};

const formatBloodPressure = (
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
): string => {
  if (systolic === null || systolic === undefined) {
    return "-- / --";
  }

  if (diastolic === null || diastolic === undefined) {
    return `${systolic} / --`;
  }

  return `${systolic} / ${diastolic}`;
};

const resolveBmiCategory = (bmi: number | null | undefined): string => {
  if (bmi === null || bmi === undefined) {
    return "Sin clasificacion";
  }

  if (bmi < 18.5) return "Bajo peso";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidad";
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

  const [activeTab, setActiveTab] = useState<DoctorTab>(DOCTOR_TAB.VITALES);
  const [selectedVisitIdState, setSelectedVisitIdState] = useState<
    number | null
  >(null);
  const [selectedVisitStatusOverride, setSelectedVisitStatusOverride] =
    useState<VisitStatusOverrideState | null>(null);
  const [timelineEntriesByVisitId, setTimelineEntriesByVisitId] = useState<
    Record<number, VisitTimelineEntry[]>
  >({});
  const [diagnosisDraftByVisitId, setDiagnosisDraftByVisitId] = useState<
    Record<number, SaveDiagnosisFormValues>
  >({});
  const [prescriptionsDraftByVisitId, setPrescriptionsDraftByVisitId] =
    useState<Record<number, string[]>>({});
  const [
    savedDiagnosisFingerprintByVisitId,
    setSavedDiagnosisFingerprintByVisitId,
  ] = useState<Record<number, string>>({});
  const [explorationNotesByVisitId, setExplorationNotesByVisitId] = useState<
    Record<number, string>
  >({});

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

  const selectedExplorationNote = selectedVisit
    ? (explorationNotesByVisitId[selectedVisit.id] ?? DEFAULT_EXPLORATION_NOTE)
    : DEFAULT_EXPLORATION_NOTE;

  const selectedSavedDiagnosis = selectedVisit
    ? diagnosisDraftByVisitId[selectedVisit.id]
    : undefined;
  const selectedSavedPrescriptions = selectedVisit
    ? (prescriptionsDraftByVisitId[selectedVisit.id] ?? [])
    : [];

  const selectedVitals = selectedVisit?.vitals ?? null;

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

  const hydrateDraftsForVisit = (visitId: number) => {
    const diagnosisDraft = diagnosisDraftByVisitId[visitId];
    const prescriptionsDraft = prescriptionsDraftByVisitId[visitId];

    diagnosisForm.reset(diagnosisDraft ?? DEFAULT_DIAGNOSIS_FORM_VALUES);
    prescriptionsForm.reset({
      itemsText: prescriptionsDraft ? prescriptionsDraft.join("\n") : "",
    });
  };

  const handleVisitChange = (nextVisitId: number) => {
    setSelectedVisitIdState(nextVisitId);
    setSelectedVisitStatusOverride(null);
    setActiveTab(DOCTOR_TAB.VITALES);
    hydrateDraftsForVisit(nextVisitId);
  };

  const handleStartConsultation = async () => {
    if (!selectedVisit || !canStartSelectedVisit) {
      return;
    }

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
      toast.success("Consulta iniciada");
    } catch (error) {
      toast.error("No se pudo iniciar la consulta", {
        description: resolveDomainErrorMessage(
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

    try {
      const result = await saveDiagnosis.mutateAsync({
        visitId: selectedVisit.id,
        data: {
          primaryDiagnosis: values.primaryDiagnosis,
          finalNote: values.finalNote,
        },
      });

      setDiagnosisDraftByVisitId((current) => ({
        ...current,
        [selectedVisit.id]: values,
      }));
      setSavedDiagnosisFingerprintByVisitId((current) => ({
        ...current,
        [selectedVisit.id]: buildDiagnosisFingerprint(values),
      }));
      appendTimelineEntry(
        selectedVisit.id,
        "Diagnostico guardado",
        `${result.primaryDiagnosis}.`,
      );
      toast.success("Diagnostico guardado");
    } catch (error) {
      toast.error("No se pudo guardar el diagnostico", {
        description: resolveDomainErrorMessage(
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

    const items = toPrescriptionItems(values.itemsText);

    try {
      const result = await savePrescriptions.mutateAsync({
        visitId: selectedVisit.id,
        data: { items },
      });

      setPrescriptionsDraftByVisitId((current) => ({
        ...current,
        [selectedVisit.id]: result.items,
      }));
      appendTimelineEntry(
        selectedVisit.id,
        "Receta guardada",
        `${result.items.length} indicacion(es) registradas.`,
      );
      toast.success("Receta guardada");
    } catch (error) {
      toast.error("No se pudo guardar la receta", {
        description: resolveDomainErrorMessage(
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

        setDiagnosisDraftByVisitId((current) => ({
          ...current,
          [selectedVisit.id]: values,
        }));
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
      toast.success("Consulta cerrada");
      diagnosisForm.reset(DEFAULT_DIAGNOSIS_FORM_VALUES);
      prescriptionsForm.reset(DEFAULT_PRESCRIPTIONS_FORM_VALUES);
      setDiagnosisDraftByVisitId((current) => ({
        ...current,
        [selectedVisit.id]: DEFAULT_DIAGNOSIS_FORM_VALUES,
      }));
      setPrescriptionsDraftByVisitId((current) => ({
        ...current,
        [selectedVisit.id]: [],
      }));
      setActiveTab(DOCTOR_TAB.MOTIVO);
    } catch (error) {
      toast.error("No se pudo cerrar la consulta", {
        description: resolveDomainErrorMessage(
          error,
          CLOSE_CONSULTATION_DOMAIN_ERROR_MESSAGE,
          FALLBACK_CLOSE_CONSULTATION_ERROR_MESSAGE,
        ),
      });
    }
  };

  const handleResetDrafts = () => {
    if (selectedVisit) {
      hydrateDraftsForVisit(selectedVisit.id);
    } else {
      diagnosisForm.reset(DEFAULT_DIAGNOSIS_FORM_VALUES);
      prescriptionsForm.reset(DEFAULT_PRESCRIPTIONS_FORM_VALUES);
    }

    toast.info("Borradores restaurados");
  };

  const handleSaveDraftClick = () => {
    void diagnosisForm.handleSubmit(handleSaveDiagnosis)();
  };

  const handleSavePrescriptionClick = () => {
    void prescriptionsForm.handleSubmit(handleSavePrescriptions)();
  };

  const handleCloseConsultationClick = () => {
    void diagnosisForm.handleSubmit(handleCloseVisit)();
  };

  return (
    <section className="space-y-6 p-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-brand">
          Consulta medica
        </h1>
        <p className="text-sm text-txt-muted">
          Visualiza datos del paciente, registra diagnostico y finaliza la
          atencion.
        </p>
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
        <section className="space-y-4">
          <article className="rounded-xl border border-line-struct bg-paper p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
              <div className="space-y-2">
                <Label htmlFor="doctor-visit-selector">Visita activa</Label>
                <Select
                  value={selectedVisitId?.toString() ?? ""}
                  onValueChange={(value) => {
                    handleVisitChange(Number(value));
                  }}
                >
                  <SelectTrigger id="doctor-visit-selector" className="w-full">
                    <SelectValue placeholder="Selecciona una visita" />
                  </SelectTrigger>
                  <SelectContent>
                    {visits.map((visit) => {
                      const status =
                        visit.id === selectedVisit?.id
                          ? selectedVisitStatus
                          : visit.status;

                      return (
                        <SelectItem key={visit.id} value={visit.id.toString()}>
                          {visit.folio} - {formatStatusLabel(status)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 rounded-lg border border-line-hairline bg-subtle/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-txt-body">
                    Folio {selectedVisit?.folio}
                  </p>
                  <Badge variant="outline" className="uppercase">
                    {formatStatusLabel(selectedVisitStatus)}
                  </Badge>
                </div>
                <p className="text-sm text-txt-muted">
                  Paciente #{selectedVisit?.patientId}
                </p>
                <div className="flex flex-wrap gap-2">
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
                  <Button
                    type="button"
                    disabled={
                      !canCloseSelectedVisit ||
                      !diagnosisForm.formState.isValid ||
                      closeVisit.isPending ||
                      saveDiagnosis.isPending
                    }
                    onClick={handleCloseConsultationClick}
                  >
                    Finalizar consulta
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" type="button">
                        Ver contexto clinico
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Contexto de la visita</DialogTitle>
                        <DialogDescription>
                          Informacion complementaria de la atencion en curso.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 text-sm text-txt-muted">
                        <p>
                          <span className="font-medium text-txt-body">
                            Servicio:
                          </span>{" "}
                          {formatServiceTypeLabel(
                            selectedVisit?.serviceType ?? "",
                          )}
                        </p>
                        <p>
                          <span className="font-medium text-txt-body">
                            Modalidad:
                          </span>{" "}
                          {formatArrivalTypeLabel(
                            selectedVisit?.arrivalType ?? "",
                          )}
                        </p>
                        <p>
                          <span className="font-medium text-txt-body">
                            Cita:
                          </span>{" "}
                          {selectedVisit?.appointmentId ?? "Sin cita"}
                        </p>
                        <p>
                          <span className="font-medium text-txt-body">
                            Doctor ID:
                          </span>{" "}
                          {selectedVisit?.doctorId ?? "Sin asignar"}
                        </p>
                        <div className="rounded-lg border border-line-hairline bg-subtle/30 p-3">
                          <p className="font-medium text-txt-body">
                            Motivo de consulta
                          </p>
                          <p className="mt-1">
                            {selectedVisit?.notes?.trim() ||
                              "Sin motivo de consulta capturado en recepcion."}
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {!canWriteDoctorConsultation ? (
              <p className="mt-3 text-sm text-txt-muted" role="status">
                No tenes permisos completos para registrar diagnostico, receta o
                cierre de consulta.
              </p>
            ) : null}
          </article>

          <Collapsible className="group/collapsible rounded-xl border border-line-struct bg-paper p-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
              <div>
                <p className="text-sm font-semibold text-txt-body">
                  Registro clinico
                </p>
                <p className="text-sm text-txt-muted">
                  Motivo, signos vitales, exploracion, diagnostico y receta.
                </p>
              </div>
              <ChevronDownIcon className="size-4 text-txt-muted transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as DoctorTab)}
              >
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-md border border-line-struct bg-subtle p-1 md:grid-cols-5">
                  <TabsTrigger
                    value={DOCTOR_TAB.MOTIVO}
                    className="h-10 data-[state=active]:bg-brand data-[state=active]:text-txt-inverse"
                  >
                    Motivo
                  </TabsTrigger>
                  <TabsTrigger
                    value={DOCTOR_TAB.VITALES}
                    className="h-10 data-[state=active]:bg-brand data-[state=active]:text-txt-inverse"
                  >
                    Signos vitales
                  </TabsTrigger>
                  <TabsTrigger
                    value={DOCTOR_TAB.EXPLORACION}
                    className="h-10 data-[state=active]:bg-brand data-[state=active]:text-txt-inverse"
                  >
                    Exploracion
                  </TabsTrigger>
                  <TabsTrigger
                    value={DOCTOR_TAB.DIAGNOSTICO}
                    className="h-10 data-[state=active]:bg-brand data-[state=active]:text-txt-inverse"
                  >
                    Diagnostico
                  </TabsTrigger>
                  <TabsTrigger
                    value={DOCTOR_TAB.RECETA}
                    className="h-10 data-[state=active]:bg-brand data-[state=active]:text-txt-inverse"
                  >
                    Receta medica
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value={DOCTOR_TAB.MOTIVO}
                  className="space-y-4 pt-4"
                >
                  <div className="rounded-xl border border-line-struct bg-subtle/40 p-4">
                    <p className="text-sm font-semibold text-txt-body">
                      Motivo de consulta
                    </p>
                    <p className="mt-2 text-sm text-txt-muted">
                      {selectedVisit?.notes?.trim() ||
                        "Recepcion no capturo observaciones para esta visita."}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-line-struct p-4">
                      <p className="text-sm text-txt-muted">
                        Servicio solicitado
                      </p>
                      <p className="mt-1 text-lg font-semibold text-txt-body">
                        {formatServiceTypeLabel(
                          selectedVisit?.serviceType ?? "",
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-line-struct p-4">
                      <p className="text-sm text-txt-muted">
                        Modalidad de ingreso
                      </p>
                      <p className="mt-1 text-lg font-semibold text-txt-body">
                        {formatArrivalTypeLabel(
                          selectedVisit?.arrivalType ?? "",
                        )}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value={DOCTOR_TAB.VITALES}
                  className="space-y-4 pt-4"
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <VitalMetricCard
                      label="Presion arterial"
                      value={formatBloodPressure(
                        selectedVitals?.bloodPressureSystolic,
                        selectedVitals?.bloodPressureDiastolic,
                      )}
                      unit="mmHg"
                    />
                    <VitalMetricCard
                      label="Frecuencia cardiaca"
                      value={formatOptionalMetric(selectedVitals?.heartRateBpm)}
                      unit="lpm"
                    />
                    <VitalMetricCard
                      label="Temperatura"
                      value={formatOptionalMetric(
                        selectedVitals?.temperatureC,
                        {
                          digits: 1,
                        },
                      )}
                      unit="C"
                    />
                    <VitalMetricCard
                      label="Peso"
                      value={formatOptionalMetric(selectedVitals?.weightKg, {
                        digits: 1,
                      })}
                      unit="kg"
                    />
                    <VitalMetricCard
                      label="Talla"
                      value={formatHeightMeters(selectedVitals?.heightCm)}
                      unit="m"
                    />
                    <VitalMetricCard
                      label="IMC"
                      value={formatOptionalMetric(selectedVitals?.bmi, {
                        digits: 1,
                      })}
                      helper={resolveBmiCategory(selectedVitals?.bmi)}
                    />
                    <VitalMetricCard
                      label="Saturacion de oxigeno"
                      value={formatOptionalMetric(
                        selectedVitals?.oxygenSaturationPct,
                      )}
                      unit="%"
                    />
                    <VitalMetricCard
                      label="Frecuencia respiratoria"
                      value={formatOptionalMetric(
                        selectedVitals?.respiratoryRateBpm,
                      )}
                      unit="resp/min"
                    />
                  </div>

                  <div className="rounded-xl border border-line-struct bg-subtle/30 p-4">
                    <p className="text-sm font-semibold text-txt-body">
                      Diagnostico actual
                    </p>
                    <p className="mt-1 text-sm text-txt-muted">
                      {selectedSavedDiagnosis?.primaryDiagnosis?.trim() ||
                        "Aun no se guarda diagnostico para esta visita."}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent
                  value={DOCTOR_TAB.EXPLORACION}
                  className="space-y-2 pt-4"
                >
                  <Label htmlFor="explorationNotes">
                    Exploracion fisica (borrador local)
                  </Label>
                  <Textarea
                    id="explorationNotes"
                    rows={5}
                    disabled={!canSaveClinicalData}
                    value={selectedExplorationNote}
                    onChange={(event) => {
                      if (!selectedVisit) {
                        return;
                      }

                      const nextValue = event.target.value;
                      setExplorationNotesByVisitId((current) => ({
                        ...current,
                        [selectedVisit.id]: nextValue,
                      }));
                    }}
                    placeholder="Describe hallazgos de exploracion fisica relevantes para la consulta."
                  />
                  <p className="text-sm text-txt-muted">
                    Esta seccion queda como borrador local en esta fase del
                    refactor.
                  </p>
                </TabsContent>

                <TabsContent
                  value={DOCTOR_TAB.DIAGNOSTICO}
                  className="space-y-4 pt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="primaryDiagnosis">
                      Diagnostico principal
                    </Label>
                    <Textarea
                      id="primaryDiagnosis"
                      rows={3}
                      disabled={!canSaveClinicalData || saveDiagnosis.isPending}
                      {...diagnosisForm.register("primaryDiagnosis")}
                    />
                    {diagnosisForm.formState.errors.primaryDiagnosis
                      ?.message ? (
                      <p className="text-sm text-status-critical" role="alert">
                        {
                          diagnosisForm.formState.errors.primaryDiagnosis
                            .message
                        }
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="finalNote">Nota final</Label>
                    <Textarea
                      id="finalNote"
                      rows={5}
                      disabled={!canSaveClinicalData || saveDiagnosis.isPending}
                      {...diagnosisForm.register("finalNote")}
                    />
                    {diagnosisForm.formState.errors.finalNote?.message ? (
                      <p className="text-sm text-status-critical" role="alert">
                        {diagnosisForm.formState.errors.finalNote.message}
                      </p>
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent
                  value={DOCTOR_TAB.RECETA}
                  className="space-y-4 pt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="prescriptions">
                      Receta (una indicacion por linea)
                    </Label>
                    <Textarea
                      id="prescriptions"
                      rows={6}
                      disabled={
                        !canSaveClinicalData || savePrescriptions.isPending
                      }
                      {...prescriptionsForm.register("itemsText")}
                    />
                    {prescriptionsForm.formState.errors.itemsText?.message ? (
                      <p className="text-sm text-status-critical" role="alert">
                        {prescriptionsForm.formState.errors.itemsText.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-line-struct bg-subtle/30 p-4">
                    <p className="text-sm font-semibold text-txt-body">
                      Indicaciones guardadas
                    </p>
                    {selectedSavedPrescriptions.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-txt-muted">
                        {selectedSavedPrescriptions.map((item, index) => (
                          <li key={`${selectedVisit?.id}-rx-${index}-${item}`}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-txt-muted">
                        Aun no hay receta registrada para esta visita.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line-hairline pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    !canSaveClinicalData ||
                    !diagnosisForm.formState.isValid ||
                    saveDiagnosis.isPending ||
                    closeVisit.isPending
                  }
                  onClick={handleSaveDraftClick}
                >
                  Guardar borrador
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    !canSaveClinicalData ||
                    !prescriptionsForm.formState.isValid ||
                    savePrescriptions.isPending
                  }
                  onClick={handleSavePrescriptionClick}
                >
                  Guardar receta
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetDrafts}
                >
                  Cancelar
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible className="group/collapsible rounded-lg border border-line-hairline bg-subtle/20 p-3">
            <CollapsibleTrigger className="flex w-full items-center justify-between text-left text-sm font-medium text-txt-body">
              Historial de la visita
              <ChevronDownIcon className="size-4 text-txt-muted transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <VisitTimelinePanel entries={selectedTimelineEntries} />
            </CollapsibleContent>
          </Collapsible>
        </section>
      ) : null}
    </section>
  );
};

export default DoctorConsultationPage;
