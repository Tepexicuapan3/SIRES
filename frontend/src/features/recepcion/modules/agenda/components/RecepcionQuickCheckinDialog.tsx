import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ARRIVAL_TYPE } from "@api/types";
import { ApiError } from "@api/utils/errors";
import { useCreateVisit } from "@features/recepcion/modules/checkin/mutations/useCreateVisit";
import { mapCheckinFormToCreateVisitRequest } from "@features/recepcion/modules/checkin/domain/checkin.mappers";
import {
  createCheckinFormSchema,
  DEFAULT_CHECKIN_FORM_VALUES,
  type CheckinFormInput,
  type CheckinFormValues,
} from "@features/recepcion/modules/checkin/domain/checkin.schemas";
import {
  RECEPCION_SERVICE_LIST,
  RECEPCION_SERVICE_PROFILES,
  isServiceForcedToWalkIn,
} from "@features/recepcion/shared/domain/recepcion.services";

interface RecepcionQuickCheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
  initialValues?: Partial<CheckinFormInput>;
}

interface FeedbackState {
  kind: "success" | "error";
  message: string;
}

const CREATE_VISIT_DOMAIN_ERROR_MESSAGE: Record<
  | "VISIT_DUPLICATE_SUBMIT"
  | "ROLE_NOT_ALLOWED"
  | "VALIDATION_ERROR"
  | "PERMISSION_DENIED",
  string
> = {
  VISIT_DUPLICATE_SUBMIT: "Ya existe una visita abierta para este paciente.",
  ROLE_NOT_ALLOWED: "No tenes permiso para registrar llegadas en recepcion.",
  VALIDATION_ERROR: "Revisa los datos de llegada antes de continuar.",
  PERMISSION_DENIED: "No tenes permiso para ejecutar esta accion.",
};

const FALLBACK_CREATE_VISIT_ERROR_MESSAGE =
  "No se pudo registrar la llegada. Intenta nuevamente.";

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

export const RecepcionQuickCheckinDialog = ({
  open,
  onOpenChange,
  canWrite,
  initialValues,
}: RecepcionQuickCheckinDialogProps) => {
  const createVisit = useCreateVisit();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const form = useForm<CheckinFormInput, unknown, CheckinFormValues>({
    resolver: zodResolver(createCheckinFormSchema),
    defaultValues: DEFAULT_CHECKIN_FORM_VALUES,
  });

  const [serviceType, arrivalType] = useWatch({
    control: form.control,
    name: ["serviceType", "arrivalType"],
  });
  const isWalkInOnlyService = isServiceForcedToWalkIn(serviceType);
  const serviceTypeField = form.register("serviceType");
  const arrivalTypeField = form.register("arrivalType");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFeedback(null);
    }

    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      ...DEFAULT_CHECKIN_FORM_VALUES,
      ...initialValues,
    });
  }, [form, initialValues, open]);

  const handleSubmit = async (values: CheckinFormValues) => {
    if (!canWrite) {
      return;
    }

    setFeedback(null);

    try {
      await createVisit.mutateAsync(mapCheckinFormToCreateVisitRequest(values));
      setFeedback({
        kind: "success",
        message: "Llegada registrada correctamente.",
      });
      form.reset(DEFAULT_CHECKIN_FORM_VALUES);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: resolveDomainErrorMessage(
          error,
          CREATE_VISIT_DOMAIN_ERROR_MESSAGE,
          FALLBACK_CREATE_VISIT_ERROR_MESSAGE,
        ),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Check-in rapido</DialogTitle>
          <DialogDescription>
            Registra llegadas sin salir de agenda.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="quick-serviceType">Servicio de atencion</Label>
            <select
              id="quick-serviceType"
              className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              disabled={!canWrite || createVisit.isPending}
              {...serviceTypeField}
              onChange={(event) => {
                serviceTypeField.onChange(event);
                const nextService = event.target
                  .value as CheckinFormValues["serviceType"];

                if (isServiceForcedToWalkIn(nextService)) {
                  form.setValue("arrivalType", ARRIVAL_TYPE.WALK_IN, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue("appointmentId", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            >
              {RECEPCION_SERVICE_LIST.map((service) => (
                <option key={service} value={service}>
                  {RECEPCION_SERVICE_PROFILES[service].label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-patientId">ID paciente</Label>
              <Input
                id="quick-patientId"
                type="number"
                disabled={!canWrite || createVisit.isPending}
                {...form.register("patientId")}
              />
              {form.formState.errors.patientId?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.patientId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-arrivalType">Tipo de llegada</Label>
              <select
                id="quick-arrivalType"
                className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                disabled={
                  !canWrite || createVisit.isPending || isWalkInOnlyService
                }
                {...arrivalTypeField}
              >
                <option value={ARRIVAL_TYPE.APPOINTMENT}>Con cita</option>
                <option value={ARRIVAL_TYPE.WALK_IN}>Sin cita</option>
              </select>
              {form.formState.errors.arrivalType?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.arrivalType.message}
                </p>
              ) : null}
            </div>
          </div>

          {arrivalType === ARRIVAL_TYPE.APPOINTMENT ? (
            <div className="space-y-2">
              <Label htmlFor="quick-appointmentId">ID de cita</Label>
              <Input
                id="quick-appointmentId"
                disabled={!canWrite || createVisit.isPending}
                {...form.register("appointmentId")}
              />
              {form.formState.errors.appointmentId?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.appointmentId.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="quick-doctorId">ID doctor (opcional)</Label>
            <Input
              id="quick-doctorId"
              type="number"
              disabled={!canWrite || createVisit.isPending}
              {...form.register("doctorId")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-notes">Notas</Label>
            <Textarea
              id="quick-notes"
              rows={3}
              disabled={!canWrite || createVisit.isPending}
              {...form.register("notes")}
            />
          </div>

          {feedback ? (
            <Alert variant={feedback.kind === "error" ? "warning" : "success"}>
              <AlertTitle>
                {feedback.kind === "error" ? "No se pudo completar" : "Listo"}
              </AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          ) : null}

          {!canWrite ? (
            <p className="text-sm text-txt-muted" role="status">
              No tenes permisos completos para registrar llegadas desde agenda.
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            <Button type="submit" disabled={!canWrite || createVisit.isPending}>
              Registrar llegada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
