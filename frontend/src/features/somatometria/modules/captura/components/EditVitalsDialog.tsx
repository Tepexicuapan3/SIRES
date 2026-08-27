import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import { ApiError } from "@api/utils/errors";
import type { VisitVitalsPayload } from "@api/types";
import {
  captureVitalsFormSchema,
  type EditVitalsFormInput,
  type EditVitalsFormValues,
} from "@features/somatometria/modules/captura/domain/capture-vitals.schemas";

const MOTIVO_MIN_LENGTH = 5;
const MOTIVO_MAX_LENGTH = 255;
import { useEditVitals } from "@features/somatometria/modules/captura/mutations/useEditVitals";

/** Mensajes de dominio del PATCH auditado (Fase 3, `edit_vitals_usecase`).
 * `400`/`403`/`404`/`422` -- ver `apply-progress-p3-p4a` en Engram. */
const EDIT_VITALS_DOMAIN_ERROR_MESSAGE: Record<string, string> = {
  VALIDATION_ERROR: "Revisa el motivo y los valores: hay campos invalidos.",
  ROLE_NOT_ALLOWED: "No tenes permiso para corregir signos vitales.",
  VISIT_NOT_FOUND: "La visita ya no existe. Actualiza la pantalla.",
  VITALS_NOT_FOUND:
    "Esta visita todavia no tiene signos vitales capturados para corregir.",
};

const FALLBACK_EDIT_VITALS_ERROR_MESSAGE =
  "No se pudo guardar la correccion. Intenta nuevamente.";

const resolveEditVitalsErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) return FALLBACK_EDIT_VITALS_ERROR_MESSAGE;
  return (
    EDIT_VITALS_DOMAIN_ERROR_MESSAGE[error.code] ||
    error.message ||
    FALLBACK_EDIT_VITALS_ERROR_MESSAGE
  );
};

const metricsToFormValues = (vitals: VisitVitalsPayload): EditVitalsFormInput => ({
  weightKg: String(vitals.weightKg),
  heightCm: String(vitals.heightCm),
  temperatureC: String(vitals.temperatureC),
  oxygenSaturationPct: String(vitals.oxygenSaturationPct),
  heartRateBpm: vitals.heartRateBpm != null ? String(vitals.heartRateBpm) : "",
  respiratoryRateBpm:
    vitals.respiratoryRateBpm != null ? String(vitals.respiratoryRateBpm) : "",
  bloodPressureSystolic:
    vitals.bloodPressureSystolic != null ? String(vitals.bloodPressureSystolic) : "",
  bloodPressureDiastolic:
    vitals.bloodPressureDiastolic != null ? String(vitals.bloodPressureDiastolic) : "",
  glucosaCapilarMgdl:
    vitals.glucosaCapilarMgdl != null ? String(vitals.glucosaCapilarMgdl) : "",
  waistCircumferenceCm:
    vitals.waistCircumferenceCm != null ? String(vitals.waistCircumferenceCm) : "",
  observations: vitals.notes ?? "",
  motivo: "",
});

interface EditMetricFieldProps {
  fieldId: string;
  label: string;
  unit: string;
  step?: number;
  error?: string;
  registration: UseFormRegisterReturn;
  optional?: boolean;
}

const EditMetricField = ({
  fieldId,
  label,
  unit,
  step,
  error,
  registration,
  optional,
}: EditMetricFieldProps) => (
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
        data-testid={`edit-vitals-${fieldId}-input`}
        type="number"
        step={step}
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

interface EditVitalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: number;
  vitals: VisitVitalsPayload;
  /** Solo para el titulo del dialog -- no viaja al backend. */
  nombrePaciente?: string | null;
}

/**
 * Edicion auditada de signos vitales YA capturados (Fase 3.9, cierre de
 * gap: el backend/hook/permiso ya existian, faltaba el punto de entrada
 * real en pantalla). Abierta desde `SomatometriaPacienteHistorialDialog`
 * sobre una ficha puntual. Muestra los valores ACTUALES precargados
 * (editables), exige `motivo` (>=5 caracteres, igual regla que el
 * backend), y pide confirmacion explicita antes de disparar el PATCH --
 * nunca guarda directo al submit del formulario.
 */
export function EditVitalsDialog({
  open,
  onOpenChange,
  visitId,
  vitals,
  nombrePaciente,
}: EditVitalsDialogProps) {
  const [pendingValues, setPendingValues] = useState<EditVitalsFormValues | null>(null);
  const editVitals = useEditVitals();

  // Sin `resolver`: `captureVitalsFormSchema` no declara `motivo`, y
  // acoplar un resolver de zod aca demostro ser fragil en la practica (el
  // callback de exito de `handleSubmit` no llegaba a dispararse de forma
  // confiable). En cambio, `handleRequestConfirmation` valida TODO a mano
  // con `captureVitalsFormSchema.safeParse` + el chequeo de `motivo`, y
  // reporta errores campo por campo via `form.setError`.
  const form = useForm<EditVitalsFormInput>({
    defaultValues: metricsToFormValues(vitals),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(metricsToFormValues(vitals));
      setPendingValues(null);
    }
    onOpenChange(nextOpen);
  };

  const handleRequestConfirmation = (values: EditVitalsFormInput) => {
    form.clearErrors();

    const parsed = captureVitalsFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof EditVitalsFormInput;
        form.setError(field, { message: issue.message });
      }
      return;
    }

    const motivo = (values.motivo ?? "").trim();

    if (motivo.length < MOTIVO_MIN_LENGTH) {
      form.setError("motivo", {
        message: `El motivo debe tener al menos ${MOTIVO_MIN_LENGTH} caracteres.`,
      });
      return;
    }

    if (motivo.length > MOTIVO_MAX_LENGTH) {
      form.setError("motivo", {
        message: `El motivo debe tener maximo ${MOTIVO_MAX_LENGTH} caracteres.`,
      });
      return;
    }

    setPendingValues({
      ...parsed.data,
      motivo,
    } as EditVitalsFormValues);
  };

  const handleConfirmSave = async () => {
    if (!pendingValues) return;

    try {
      await editVitals.mutateAsync({
        visitId,
        data: {
          weightKg: pendingValues.weightKg,
          heightCm: pendingValues.heightCm,
          temperatureC: pendingValues.temperatureC,
          oxygenSaturationPct: pendingValues.oxygenSaturationPct,
          heartRateBpm: pendingValues.heartRateBpm,
          respiratoryRateBpm: pendingValues.respiratoryRateBpm,
          bloodPressureSystolic: pendingValues.bloodPressureSystolic,
          bloodPressureDiastolic: pendingValues.bloodPressureDiastolic,
          glucosaCapilarMgdl: pendingValues.glucosaCapilarMgdl,
          waistCircumferenceCm: pendingValues.waistCircumferenceCm,
          notes: pendingValues.observations,
          motivo: pendingValues.motivo,
        },
      });

      toast.success("Signos vitales corregidos correctamente.");
      setPendingValues(null);
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo corregir", {
        description: resolveEditVitalsErrorMessage(error),
      });
      setPendingValues(null);
    }
  };

  const errors = form.formState.errors;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
          data-testid="edit-vitals-dialog"
        >
          <DialogHeader>
            <DialogTitle>
              Corregir signos vitales{nombrePaciente ? ` — ${nombrePaciente}` : ""}
            </DialogTitle>
            <DialogDescription>
              Los valores quedan auditados: se registra quien corrigio, cuando, y
              el motivo. El registro original nunca se pierde.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4" data-testid="edit-vitals-form">
            <div className="grid grid-cols-2 gap-4">
              <EditMetricField
                fieldId="heightCm"
                label="Talla"
                unit="cm"
                registration={form.register("heightCm")}
                error={errors.heightCm?.message}
              />
              <EditMetricField
                fieldId="weightKg"
                label="Peso"
                unit="kg"
                step={0.1}
                registration={form.register("weightKg")}
                error={errors.weightKg?.message}
              />
              <EditMetricField
                fieldId="temperatureC"
                label="Temperatura"
                unit="°C"
                step={0.1}
                registration={form.register("temperatureC")}
                error={errors.temperatureC?.message}
              />
              <EditMetricField
                fieldId="oxygenSaturationPct"
                label="Sat. O2"
                unit="%"
                registration={form.register("oxygenSaturationPct")}
                error={errors.oxygenSaturationPct?.message}
              />
              <EditMetricField
                fieldId="heartRateBpm"
                label="Frec. cardiaca"
                unit="lpm"
                optional
                registration={form.register("heartRateBpm")}
                error={errors.heartRateBpm?.message}
              />
              <EditMetricField
                fieldId="respiratoryRateBpm"
                label="Frec. respiratoria"
                unit="rpm"
                optional
                registration={form.register("respiratoryRateBpm")}
                error={errors.respiratoryRateBpm?.message}
              />
              <EditMetricField
                fieldId="glucosaCapilarMgdl"
                label="Glucosa capilar"
                unit="mg/dL"
                optional
                registration={form.register("glucosaCapilarMgdl")}
                error={errors.glucosaCapilarMgdl?.message}
              />
              <EditMetricField
                fieldId="waistCircumferenceCm"
                label="Cintura"
                unit="cm"
                optional
                registration={form.register("waistCircumferenceCm")}
                error={errors.waistCircumferenceCm?.message}
              />
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <EditMetricField
                  fieldId="bloodPressureSystolic"
                  label="T.A. sistolica"
                  unit="mmHg"
                  optional
                  registration={form.register("bloodPressureSystolic")}
                  error={errors.bloodPressureSystolic?.message}
                />
                <EditMetricField
                  fieldId="bloodPressureDiastolic"
                  label="T.A. diastolica"
                  unit="mmHg"
                  optional
                  registration={form.register("bloodPressureDiastolic")}
                  error={errors.bloodPressureDiastolic?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vitals-observations">
                Observaciones
                <span className="ml-1 text-xs font-normal text-txt-muted">
                  (opcional)
                </span>
              </Label>
              <Textarea
                id="edit-vitals-observations"
                data-testid="edit-vitals-observations-input"
                {...form.register("observations")}
              />
              {errors.observations ? (
                <p className="text-sm text-status-critical" role="alert">
                  {errors.observations.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 rounded-xl border border-line-struct bg-subtle/40 p-3">
              <Label htmlFor="edit-vitals-motivo">
                Motivo de la correccion
                <span className="ml-1 text-xs font-normal text-status-critical">
                  (obligatorio)
                </span>
              </Label>
              <Textarea
                id="edit-vitals-motivo"
                data-testid="edit-vitals-motivo-input"
                placeholder="Ej. Se registro mal la presion diastolica, el paciente confirma el valor correcto."
                {...form.register("motivo")}
              />
              {errors.motivo ? (
                <p className="text-sm text-status-critical" role="alert">
                  {errors.motivo.message}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                data-testid="edit-vitals-submit-button"
                onClick={form.handleSubmit(handleRequestConfirmation)}
              >
                Guardar correccion
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingValues !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingValues(null);
        }}
      >
        <AlertDialogContent data-testid="edit-vitals-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Confirmas la correccion de los signos vitales?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion queda registrada en la bitacora de auditoria con tu
              usuario, la fecha/hora, y el motivo indicado. El registro anterior
              no se borra.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              data-testid="edit-vitals-confirm-button"
              disabled={editVitals.isPending}
              onClick={() => {
                void handleConfirmSave();
              }}
            >
              Confirmar correccion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default EditVitalsDialog;
