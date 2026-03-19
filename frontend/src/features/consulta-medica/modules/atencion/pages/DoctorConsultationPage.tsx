import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@api/utils/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  VISIT_SERVICE,
  VISIT_STATUS,
  type CieSearchItem,
  type VisitStatus,
} from "@api/types";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
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
import { useCieSearch } from "@features/consulta-medica/modules/atencion/queries/useCieSearch";
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

const OPEN_VISIT_STATUSES = new Set<VisitStatus>([
  VISIT_STATUS.LISTA_PARA_DOCTOR,
  VISIT_STATUS.EN_CONSULTA,
]);

const MISSING_VITAL_VALUE = "No registrado";

const DEFAULT_DIAGNOSIS_FORM_VALUES: SaveDiagnosisFormInput = {
  primaryDiagnosis: "",
  finalNote: "",
  cieCode: "",
};

const DEFAULT_PRESCRIPTIONS_FORM_VALUES: SavePrescriptionsFormInput = {
  itemsText: "",
};

interface VisitStatusOverrideState {
  visitId: number;
  status: VisitStatus;
}

interface VitalMetricProps {
  label: string;
  value: string;
}

const VitalMetric = ({ label, value }: VitalMetricProps) => {
  return (
    <article className="rounded-lg border border-line-hairline bg-subtle/20 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-txt-muted">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-txt-body">{value}</p>
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
    return MISSING_VITAL_VALUE;
  }

  const digits = options.digits ?? 0;
  return digits > 0 ? value.toFixed(digits) : value.toString();
};

const formatBloodPressure = (
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
): string => {
  const hasSystolic = systolic !== null && systolic !== undefined;
  const hasDiastolic = diastolic !== null && diastolic !== undefined;

  if (!hasSystolic && !hasDiastolic) {
    return MISSING_VITAL_VALUE;
  }

  if (systolic === null || systolic === undefined) {
    return `-- / ${diastolic}`;
  }

  if (diastolic === null || diastolic === undefined) {
    return `${systolic} / --`;
  }

  return `${systolic} / ${diastolic}`;
};

const formatMetricWithUnit = (
  value: number | null | undefined,
  unit: string,
  options: {
    digits?: number;
  } = {},
): string => {
  const formatted = formatOptionalMetric(value, options);
  if (formatted === MISSING_VITAL_VALUE) {
    return formatted;
  }

  return `${formatted} ${unit}`;
};

const formatSomatometriaNotes = (value: string | null | undefined): string => {
  const normalized = value?.trim();
  if (!normalized) {
    return "Sin observaciones de somatometria registradas.";
  }

  return normalized;
};

const hasVitalValue = (value: number | null | undefined): boolean => {
  return value !== null && value !== undefined;
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
  cieCode,
}: SaveDiagnosisFormValues): string => {
  return `${primaryDiagnosis.trim()}::${finalNote.trim()}::${cieCode.trim().toUpperCase()}`;
};

const normalizeCieCode = (value: string): string | undefined => {
  const normalized = value.trim().toUpperCase();
  return normalized.length > 0 ? normalized : undefined;
};

const formatCieLabel = (cie: CieSearchItem): string => {
  return `${cie.code} - ${cie.description}`;
};

export const DoctorConsultationPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ visitId?: string }>();

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

  const [selectedVisitStatusOverride, setSelectedVisitStatusOverride] =
    useState<VisitStatusOverrideState | null>(null);
  const [diagnosisDraftByVisitId, setDiagnosisDraftByVisitId] = useState<
    Record<number, SaveDiagnosisFormValues>
  >({});
  const [prescriptionsDraftByVisitId, setPrescriptionsDraftByVisitId] =
    useState<Record<number, string[]>>({});
  const [
    savedDiagnosisFingerprintByVisitId,
    setSavedDiagnosisFingerprintByVisitId,
  ] = useState<Record<number, string>>({});
  const [cieSearchTerm, setCieSearchTerm] = useState("");
  const [selectedCieByVisitId, setSelectedCieByVisitId] = useState<
    Record<number, CieSearchItem>
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

  const visits = (queueQuery.data?.items ?? []).filter((visit) => {
    return OPEN_VISIT_STATUSES.has(visit.status);
  });

  const parsedVisitId = Number.parseInt(params.visitId ?? "", 10);
  const selectedVisitId = Number.isNaN(parsedVisitId) ? null : parsedVisitId;
  const isDetailRoute = params.visitId !== undefined;

  const selectedVisit =
    visits.find((visit) => visit.id === selectedVisitId) ?? null;

  const selectedCieCode = diagnosisForm.watch("cieCode").trim().toUpperCase();
  const debouncedCieSearchTerm = useDebounce(cieSearchTerm, 300);
  const normalizedCieSearchTerm = debouncedCieSearchTerm.trim();
  const shouldSearchCies =
    Boolean(selectedVisit) &&
    canWriteDoctorConsultation &&
    normalizedCieSearchTerm.length >= 2 &&
    selectedCieCode.length === 0;

  const ciesSearchQuery = useCieSearch(
    {
      search: normalizedCieSearchTerm,
      limit: 8,
    },
    {
      enabled: shouldSearchCies,
    },
  );

  const selectedCie = selectedVisit
    ? selectedCieByVisitId[selectedVisit.id]
    : undefined;
  const selectedCieLabel = selectedCie
    ? formatCieLabel(selectedCie)
    : selectedCieCode;
  const ciesSearchItems = ciesSearchQuery.data?.items ?? [];

  const hasStaleSelectedVisit =
    isDetailRoute && selectedVisitId !== null && selectedVisit === null;

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

  const selectedSavedPrescriptions = selectedVisit
    ? (prescriptionsDraftByVisitId[selectedVisit.id] ?? [])
    : [];

  const selectedVitals = selectedVisit?.vitals ?? null;
  const hasOptionalVitals =
    hasVitalValue(selectedVitals?.heartRateBpm) ||
    hasVitalValue(selectedVitals?.respiratoryRateBpm) ||
    hasVitalValue(selectedVitals?.bloodPressureSystolic) ||
    hasVitalValue(selectedVitals?.bloodPressureDiastolic);

  const hydrateDraftsForVisit = (visitId: number) => {
    const diagnosisDraft = diagnosisDraftByVisitId[visitId];
    const prescriptionsDraft = prescriptionsDraftByVisitId[visitId];
    const normalizedCieCode = (diagnosisDraft?.cieCode ?? "")
      .trim()
      .toUpperCase();
    const selectedCieForVisit = selectedCieByVisitId[visitId];

    diagnosisForm.reset(diagnosisDraft ?? DEFAULT_DIAGNOSIS_FORM_VALUES);
    prescriptionsForm.reset({
      itemsText: prescriptionsDraft ? prescriptionsDraft.join("\n") : "",
    });

    if (selectedCieForVisit && selectedCieForVisit.code === normalizedCieCode) {
      setCieSearchTerm(formatCieLabel(selectedCieForVisit));
      return;
    }

    setCieSearchTerm(normalizedCieCode);
  };

  const handleVisitChange = (nextVisitId: number) => {
    navigate(`/clinico/consultas/doctor/${nextVisitId}`);
  };

  const handleConsultationModalOpenChange = (open: boolean) => {
    if (!open) {
      navigate("/clinico/consultas/doctor");
    }
  };

  useEffect(() => {
    if (!selectedVisit || !isDetailRoute) {
      return;
    }

    const diagnosisDraft = diagnosisDraftByVisitId[selectedVisit.id];
    const prescriptionsDraft = prescriptionsDraftByVisitId[selectedVisit.id];
    const normalizedCieCode = (diagnosisDraft?.cieCode ?? "")
      .trim()
      .toUpperCase();

    diagnosisForm.reset(diagnosisDraft ?? DEFAULT_DIAGNOSIS_FORM_VALUES);
    prescriptionsForm.reset({
      itemsText: prescriptionsDraft ? prescriptionsDraft.join("\n") : "",
    });

    setCieSearchTerm(normalizedCieCode);
  }, [
    diagnosisDraftByVisitId,
    diagnosisForm,
    isDetailRoute,
    prescriptionsDraftByVisitId,
    prescriptionsForm,
    selectedVisit,
  ]);

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

  const handleSelectCie = (cie: CieSearchItem) => {
    if (!selectedVisit) {
      return;
    }

    setSelectedCieByVisitId((current) => ({
      ...current,
      [selectedVisit.id]: cie,
    }));
    diagnosisForm.setValue("cieCode", cie.code, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const currentDiagnosis = diagnosisForm.getValues("primaryDiagnosis").trim();
    if (!currentDiagnosis) {
      diagnosisForm.setValue("primaryDiagnosis", cie.description, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    setCieSearchTerm(formatCieLabel(cie));
  };

  const handleClearCieSelection = () => {
    if (selectedVisit) {
      setSelectedCieByVisitId((current) => {
        const next = { ...current };
        delete next[selectedVisit.id];
        return next;
      });
    }

    diagnosisForm.setValue("cieCode", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    setCieSearchTerm("");
  };

  const handleSaveDiagnosis = async (values: SaveDiagnosisFormValues) => {
    if (!selectedVisit || !canSaveClinicalData) {
      return;
    }

    const normalizedCieCode = normalizeCieCode(values.cieCode);
    const diagnosisPayload = {
      primaryDiagnosis: values.primaryDiagnosis,
      finalNote: values.finalNote,
      ...(normalizedCieCode ? { cieCode: normalizedCieCode } : {}),
    };

    try {
      await saveDiagnosis.mutateAsync({
        visitId: selectedVisit.id,
        data: diagnosisPayload,
      });

      setDiagnosisDraftByVisitId((current) => ({
        ...current,
        [selectedVisit.id]: values,
      }));
      setSavedDiagnosisFingerprintByVisitId((current) => ({
        ...current,
        [selectedVisit.id]: buildDiagnosisFingerprint(values),
      }));
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

    const normalizedCieCode = normalizeCieCode(values.cieCode);
    const diagnosisPayload = {
      primaryDiagnosis: values.primaryDiagnosis,
      finalNote: values.finalNote,
      ...(normalizedCieCode ? { cieCode: normalizedCieCode } : {}),
    };

    const diagnosisFingerprint = buildDiagnosisFingerprint(values);
    const hasMatchingSavedDiagnosis =
      savedDiagnosisFingerprintByVisitId[selectedVisit.id] ===
      diagnosisFingerprint;

    try {
      if (!hasMatchingSavedDiagnosis) {
        await saveDiagnosis.mutateAsync({
          visitId: selectedVisit.id,
          data: diagnosisPayload,
        });

        setDiagnosisDraftByVisitId((current) => ({
          ...current,
          [selectedVisit.id]: values,
        }));
        setSavedDiagnosisFingerprintByVisitId((current) => ({
          ...current,
          [selectedVisit.id]: diagnosisFingerprint,
        }));
      }

      await closeVisit.mutateAsync({
        visitId: selectedVisit.id,
        data: diagnosisPayload,
      });

      setSelectedVisitStatusOverride({
        visitId: selectedVisit.id,
        status: VISIT_STATUS.CERRADA,
      });
      toast.success("Consulta cerrada");
      navigate("/clinico/consultas/doctor");
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
      setSelectedCieByVisitId((current) => {
        const next = { ...current };
        delete next[selectedVisit.id];
        return next;
      });
      setCieSearchTerm("");
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
      setCieSearchTerm("");
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
          Flujo clinico lineal: inicia consulta, registra diagnostico y finaliza
          la atencion.
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
      (visits.length > 0 || isDetailRoute) ? (
        <section className="space-y-4">
          {visits.length > 0 ? (
            <article className="rounded-xl border border-line-struct bg-paper p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-txt-body">
                  Consultas abiertas ({visits.length})
                </p>
                <p className="text-sm text-txt-muted">
                  Selecciona una card para abrir el detalle de atencion clinica.
                </p>
              </div>

              <div
                className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                data-testid="doctor-open-consultations-grid"
              >
                {visits.map((visit) => {
                  return (
                    <button
                      key={visit.id}
                      type="button"
                      className="rounded-lg border border-line-hairline bg-paper p-3 text-left transition hover:border-brand/50"
                      data-testid={`doctor-visit-card-${visit.id}`}
                      data-visit-folio={visit.folio}
                      onClick={() => {
                        handleVisitChange(visit.id);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-txt-body">
                          {visit.folio}
                        </p>
                        <Badge variant="outline" className="uppercase">
                          {formatStatusLabel(visit.status)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-txt-muted">
                        Paciente #{visit.patientId}
                      </p>
                      <p className="mt-1 text-xs text-txt-muted">
                        {formatServiceTypeLabel(visit.serviceType)} -{" "}
                        {formatArrivalTypeLabel(visit.arrivalType)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </article>
          ) : null}

          <Dialog
            open={isDetailRoute}
            onOpenChange={handleConsultationModalOpenChange}
          >
            <DialogContent
              className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"
              data-testid="doctor-consultation-modal"
            >
              <DialogHeader>
                <DialogTitle>Detalle de consulta medica</DialogTitle>
                <DialogDescription>
                  Inicia la consulta, registra diagnostico, receta y finaliza la
                  atencion clinica.
                </DialogDescription>
              </DialogHeader>

              {selectedVisit ? (
                <div className="space-y-4">
                  <div className="space-y-4 rounded-lg border border-line-hairline bg-subtle/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-semibold text-txt-body">
                        Folio {selectedVisit.folio}
                      </p>
                      <Badge variant="outline" className="uppercase">
                        {formatStatusLabel(selectedVisitStatus)}
                      </Badge>
                    </div>
                    <p className="text-sm text-txt-muted">
                      Paciente #{selectedVisit.patientId}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <p className="text-sm text-txt-muted">
                        <span className="font-medium text-txt-body">
                          Servicio:
                        </span>{" "}
                        {formatServiceTypeLabel(selectedVisit.serviceType)}
                      </p>
                      <p className="text-sm text-txt-muted">
                        <span className="font-medium text-txt-body">
                          Modalidad:
                        </span>{" "}
                        {formatArrivalTypeLabel(selectedVisit.arrivalType)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line-hairline bg-paper p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-txt-muted">
                        Motivo de consulta
                      </p>
                      <p className="mt-1 text-sm text-txt-body">
                        {selectedVisit.notes?.trim() ||
                          "Sin motivo de consulta capturado en recepcion."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-txt-muted">
                        Signos vitales
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        <VitalMetric
                          label="Peso"
                          value={formatMetricWithUnit(
                            selectedVitals?.weightKg,
                            "kg",
                          )}
                        />
                        <VitalMetric
                          label="Talla"
                          value={formatMetricWithUnit(
                            selectedVitals?.heightCm,
                            "cm",
                          )}
                        />
                        <VitalMetric
                          label="Temperatura"
                          value={formatMetricWithUnit(
                            selectedVitals?.temperatureC,
                            "C",
                            {
                              digits: 1,
                            },
                          )}
                        />
                        <VitalMetric
                          label="Saturacion de oxigeno"
                          value={formatMetricWithUnit(
                            selectedVitals?.oxygenSaturationPct,
                            "%",
                          )}
                        />
                        <VitalMetric
                          label="IMC"
                          value={formatOptionalMetric(selectedVitals?.bmi, {
                            digits: 1,
                          })}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-line-hairline bg-paper p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-txt-muted">
                        Observaciones de somatometria
                      </p>
                      <p className="mt-1 text-sm text-txt-body">
                        {formatSomatometriaNotes(selectedVitals?.notes)}
                      </p>
                    </div>

                    {hasOptionalVitals ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-txt-muted">
                          Vitals adicionales
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          {hasVitalValue(
                            selectedVitals?.bloodPressureSystolic,
                          ) ||
                          hasVitalValue(
                            selectedVitals?.bloodPressureDiastolic,
                          ) ? (
                            <VitalMetric
                              label="Presion arterial"
                              value={`${formatBloodPressure(
                                selectedVitals?.bloodPressureSystolic,
                                selectedVitals?.bloodPressureDiastolic,
                              )} mmHg`}
                            />
                          ) : null}

                          {hasVitalValue(selectedVitals?.heartRateBpm) ? (
                            <VitalMetric
                              label="Frecuencia cardiaca"
                              value={formatMetricWithUnit(
                                selectedVitals.heartRateBpm,
                                "lpm",
                              )}
                            />
                          ) : null}

                          {hasVitalValue(selectedVitals?.respiratoryRateBpm) ? (
                            <VitalMetric
                              label="Frecuencia respiratoria"
                              value={formatMetricWithUnit(
                                selectedVitals.respiratoryRateBpm,
                                "rpm",
                              )}
                            />
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>

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

                  {!canWriteDoctorConsultation ? (
                    <p className="text-sm text-txt-muted" role="status">
                      No tenes permisos completos para registrar diagnostico,
                      receta o cierre de consulta.
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="cieSearch">Buscar CIE (opcional)</Label>
                    <Input
                      id="cieSearch"
                      value={cieSearchTerm}
                      placeholder="Ej. A090 o gastroenteritis"
                      disabled={!canSaveClinicalData || saveDiagnosis.isPending}
                      onChange={(event) => {
                        const nextSearch = event.target.value;
                        setCieSearchTerm(nextSearch);

                        if (selectedCieCode) {
                          diagnosisForm.setValue("cieCode", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }

                        if (
                          selectedVisit &&
                          selectedCieByVisitId[selectedVisit.id]
                        ) {
                          setSelectedCieByVisitId((current) => {
                            const next = { ...current };
                            delete next[selectedVisit.id];
                            return next;
                          });
                        }
                      }}
                    />
                    <input
                      type="hidden"
                      {...diagnosisForm.register("cieCode")}
                    />

                    {selectedCieCode ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm text-txt-muted">
                          CIE seleccionado: <strong>{selectedCieLabel}</strong>
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={
                            !canSaveClinicalData || saveDiagnosis.isPending
                          }
                          onClick={handleClearCieSelection}
                        >
                          Quitar CIE
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-txt-muted">
                        Escribe al menos 2 caracteres para buscar por clave o
                        descripcion.
                      </p>
                    )}

                    {shouldSearchCies && ciesSearchQuery.isFetching ? (
                      <p className="text-sm text-txt-muted">Buscando CIE...</p>
                    ) : null}

                    {shouldSearchCies && ciesSearchQuery.isError ? (
                      <p className="text-sm text-status-critical" role="alert">
                        No se pudo cargar resultados CIE.
                      </p>
                    ) : null}

                    {shouldSearchCies &&
                    !ciesSearchQuery.isFetching &&
                    !ciesSearchQuery.isError &&
                    ciesSearchItems.length === 0 ? (
                      <p className="text-sm text-txt-muted">
                        Sin coincidencias para esa busqueda.
                      </p>
                    ) : null}

                    {shouldSearchCies &&
                    !ciesSearchQuery.isError &&
                    ciesSearchItems.length > 0 ? (
                      <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-line-hairline bg-paper p-2">
                        {ciesSearchItems.map((item) => (
                          <button
                            key={`${selectedVisit.id}-cie-${item.code}`}
                            type="button"
                            className="w-full rounded-md border border-transparent px-3 py-2 text-left text-sm text-txt-body transition hover:border-brand/40 hover:bg-subtle/30"
                            onClick={() => {
                              handleSelectCie(item);
                            }}
                          >
                            <p className="font-medium">{item.code}</p>
                            <p className="text-xs text-txt-muted">
                              {item.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

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
                      placeholder="Opcional"
                    />
                    {prescriptionsForm.formState.errors.itemsText?.message ? (
                      <p className="text-sm text-status-critical" role="alert">
                        {prescriptionsForm.formState.errors.itemsText.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-line-hairline bg-subtle/20 p-3">
                    <p className="text-sm font-semibold text-txt-body">
                      Indicaciones guardadas
                    </p>
                    {selectedSavedPrescriptions.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-txt-muted">
                        {selectedSavedPrescriptions.map((item, index) => (
                          <li key={`${selectedVisit.id}-rx-${index}-${item}`}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-txt-muted">
                        Aun no hay receta registrada para esta visita.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-line-hairline pt-4">
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
                      Guardar diagnostico
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
                      disabled={
                        saveDiagnosis.isPending ||
                        savePrescriptions.isPending ||
                        closeVisit.isPending
                      }
                      onClick={handleResetDrafts}
                    >
                      Restaurar borradores
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

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        navigate("/clinico/consultas/doctor");
                      }}
                    >
                      Volver a bandeja
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-txt-muted" role="status">
                  {hasStaleSelectedVisit
                    ? "La consulta seleccionada ya no esta disponible. Elige otra consulta abierta."
                    : "Selecciona una consulta abierta para iniciar la atencion clinica."}
                </p>
              )}
            </DialogContent>
          </Dialog>
        </section>
      ) : null}
    </section>
  );
};

export default DoctorConsultationPage;
