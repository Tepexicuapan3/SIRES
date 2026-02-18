import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ARRIVAL_TYPE,
  RECEPCION_STATUS_ACTION,
  VISIT_STATUS,
  type RecepcionStatusAction,
} from "@api/types";
import { VisitStageNavigator } from "@features/flujo-clinico/components/VisitStageNavigator";
import {
  VISIT_STAGE,
  canRunRecepcionStatusAction,
} from "@features/flujo-clinico/domain/visit-flow.constants";
import {
  createVisitFormSchema,
  type CreateVisitFormInput,
  type CreateVisitFormValues,
} from "@features/flujo-clinico/domain/visit-flow.schemas";
import { useCreateVisit } from "@features/flujo-clinico/mutations/useCreateVisit";
import { useVisitStatusAction } from "@features/flujo-clinico/mutations/useVisitStatusAction";
import { useRecepcionQueue } from "@features/flujo-clinico/queries/useRecepcionQueue";

const DEFAULT_FORM_VALUES: CreateVisitFormInput = {
  patientId: undefined,
  arrivalType: ARRIVAL_TYPE.APPOINTMENT,
  appointmentId: "",
  doctorId: undefined,
  notes: "",
};

const formatStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ");
};

export const RecepcionQueuePage = () => {
  const queueQuery = useRecepcionQueue();
  const createVisit = useCreateVisit();
  const visitStatusAction = useVisitStatusAction();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const form = useForm<CreateVisitFormInput, unknown, CreateVisitFormValues>({
    resolver: zodResolver(createVisitFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const arrivalType = form.watch("arrivalType");

  const handleCreateVisit = async (values: CreateVisitFormValues) => {
    setFeedbackMessage(null);
    await createVisit.mutateAsync(values);
    setFeedbackMessage("Llegada registrada correctamente.");
    form.reset(DEFAULT_FORM_VALUES);
  };

  const handleStatusAction = async (
    visitId: number,
    targetStatus: RecepcionStatusAction,
  ) => {
    setFeedbackMessage(null);
    await visitStatusAction.mutateAsync({ visitId, targetStatus });
    setFeedbackMessage("Estado de visita actualizado.");
  };

  const visits = queueQuery.data?.items ?? [];
  const currentStatus = visits[0]?.status ?? VISIT_STATUS.EN_ESPERA;

  return (
    <section className="space-y-6 p-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-txt-body">
          Bandeja de recepcion
        </h1>
        <p className="text-sm text-txt-muted">
          Registra llegadas y gestiona acciones operativas de la cola.
        </p>
        <VisitStageNavigator
          currentStatus={currentStatus}
          currentStage={VISIT_STAGE.RECEPCION}
        />
      </header>

      {queueQuery.isLoading ? (
        <p className="text-sm text-txt-muted">Cargando cola de recepcion...</p>
      ) : null}

      {queueQuery.isError ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>
            No se pudo cargar la cola de recepcion.
          </AlertDescription>
        </Alert>
      ) : null}

      {!queueQuery.isLoading && !queueQuery.isError && visits.length === 0 ? (
        <p className="text-sm text-txt-muted">No hay pacientes en recepcion.</p>
      ) : null}

      {!queueQuery.isLoading && !queueQuery.isError && visits.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-line-struct">
          <table className="min-w-full divide-y divide-line-struct text-sm">
            <thead className="bg-subtle">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Folio</th>
                <th className="px-3 py-2 text-left font-medium">Paciente</th>
                <th className="px-3 py-2 text-left font-medium">Estado</th>
                <th className="px-3 py-2 text-left font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-struct">
              {visits.map((visit) => {
                const canRunAction = canRunRecepcionStatusAction(visit.status);

                return (
                  <tr key={visit.id}>
                    <td className="px-3 py-2 font-medium">{visit.folio}</td>
                    <td className="px-3 py-2">{visit.patientId}</td>
                    <td className="px-3 py-2 capitalize">
                      {formatStatusLabel(visit.status)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            !canRunAction || visitStatusAction.isPending
                          }
                          onClick={() =>
                            handleStatusAction(
                              visit.id,
                              RECEPCION_STATUS_ACTION.CANCELADA,
                            )
                          }
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            !canRunAction || visitStatusAction.isPending
                          }
                          onClick={() =>
                            handleStatusAction(
                              visit.id,
                              RECEPCION_STATUS_ACTION.NO_SHOW,
                            )
                          }
                        >
                          Marcar no show
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <section className="space-y-4 rounded-xl border border-line-struct bg-paper p-4">
        <h2 className="text-lg font-semibold text-txt-body">
          Registro de llegada
        </h2>

        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(handleCreateVisit)}
        >
          <div className="space-y-2">
            <Label htmlFor="patientId">ID paciente</Label>
            <Input
              id="patientId"
              type="number"
              {...form.register("patientId")}
            />
            {form.formState.errors.patientId?.message ? (
              <p className="text-sm text-status-critical" role="alert">
                {form.formState.errors.patientId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="arrivalType">Tipo de llegada</Label>
            <select
              id="arrivalType"
              className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              {...form.register("arrivalType")}
            >
              <option value={ARRIVAL_TYPE.APPOINTMENT}>Con cita</option>
              <option value={ARRIVAL_TYPE.WALK_IN}>Sin cita</option>
            </select>
          </div>

          {arrivalType === ARRIVAL_TYPE.APPOINTMENT ? (
            <div className="space-y-2">
              <Label htmlFor="appointmentId">ID de cita</Label>
              <Input id="appointmentId" {...form.register("appointmentId")} />
              {form.formState.errors.appointmentId?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {form.formState.errors.appointmentId.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="doctorId">ID doctor (opcional)</Label>
            <Input id="doctorId" type="number" {...form.register("doctorId")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
          </div>

          <Button type="submit" disabled={createVisit.isPending}>
            Registrar llegada
          </Button>
        </form>

        {feedbackMessage ? (
          <p className="text-sm text-status-info" role="status">
            {feedbackMessage}
          </p>
        ) : null}
      </section>
    </section>
  );
};

export default RecepcionQueuePage;
