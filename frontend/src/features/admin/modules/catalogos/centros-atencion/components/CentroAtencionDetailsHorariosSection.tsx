import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { Badge } from "@shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Switch } from "@shared/ui/switch";
import { Label } from "@shared/ui/label";
import {
  centroAtencionHorarioSchema,
  type CentroAtencionHorarioFormValues,
} from "@features/admin/modules/catalogos/centros-atencion/domain/centros-atencion.schemas";
import { useCentroAtencionHorariosList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentroAtencionHorariosList";
import { useTurnosList } from "@features/admin/modules/catalogos/turnos/queries/useTurnosList";
import { CatalogFkCombobox } from "@features/admin/modules/catalogos/shared/components/CatalogFkCombobox";
import { useCreateCentroAtencionHorario } from "@features/admin/modules/catalogos/centros-atencion/mutations/useCreateCentroAtencionHorario";
import { useUpdateCentroAtencionHorario } from "@features/admin/modules/catalogos/centros-atencion/mutations/useUpdateCentroAtencionHorario";
import { useDeleteCentroAtencionHorario } from "@features/admin/modules/catalogos/centros-atencion/mutations/useDeleteCentroAtencionHorario";
import { getCentroAtencionErrorMessage } from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.feedback";
import {
  buildCreateCentroAtencionHorarioPayload,
  buildUpdateCentroAtencionHorarioPayload,
  mapCentroAtencionHorarioDetailToFormValues,
} from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.transform";
import type { CentroAtencionHorarioListItem, DiaSemana } from "@api/types";

const DIA_LABELS: Record<DiaSemana, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

const DEFAULT_HORARIO_VALUES: CentroAtencionHorarioFormValues = {
  centerId: 0,
  shiftId: 0,
  weekDay: 1,
  isOpen: true,
  is24Hours: false,
  openingTime: null,
  closingTime: null,
  observations: null,
  isActive: true,
};

interface Props {
  centerId: number;
  canEdit: boolean;
}

export function CentroAtencionDetailsHorariosSection({
  centerId,
  canEdit,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<CentroAtencionHorarioListItem | null>(null);

  const { data, isLoading } = useCentroAtencionHorariosList(
    { centerId, pageSize: 100 },
    { enabled: Boolean(centerId) },
  );

  const { data: turnosData } = useTurnosList({ pageSize: 100 });
  const turnosOptions = (turnosData?.items ?? []).map((t) => ({ id: t.id, name: t.name }));

  const createSchedule = useCreateCentroAtencionHorario();
  const updateSchedule = useUpdateCentroAtencionHorario();
  const deleteSchedule = useDeleteCentroAtencionHorario();

  const form = useForm<CentroAtencionHorarioFormValues>({
    resolver: zodResolver(centroAtencionHorarioSchema),
    defaultValues: DEFAULT_HORARIO_VALUES,
  });

  const isOpen = form.watch("isOpen");
  const is24Hours = form.watch("is24Hours");

  const openCreate = () => {
    setEditingSchedule(null);
    form.reset({ ...DEFAULT_HORARIO_VALUES, centerId });
    setDialogOpen(true);
  };

  const openEdit = (schedule: CentroAtencionHorarioListItem) => {
    setEditingSchedule(schedule);
    form.reset(
      mapCentroAtencionHorarioDetailToFormValues({
        ...schedule,
        observations: null,
        createdAt: "",
        createdBy: null,
        updatedAt: null,
        updatedBy: null,
      }),
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingSchedule(null);
    form.reset(DEFAULT_HORARIO_VALUES);
  };

  const handleSubmit = async (values: CentroAtencionHorarioFormValues) => {
    try {
      if (editingSchedule) {
        const payload = buildUpdateCentroAtencionHorarioPayload(
          values,
          form.formState.dirtyFields as Partial<
            Record<keyof CentroAtencionHorarioFormValues, boolean>
          >,
        );
        await updateSchedule.mutateAsync({
          scheduleId: editingSchedule.id,
          data: payload,
        });
        toast.success("Horario actualizado");
      } else {
        const payload = buildCreateCentroAtencionHorarioPayload(values);
        await createSchedule.mutateAsync({ data: payload });
        toast.success("Horario creado");
      }
      closeDialog();
    } catch (error) {
      toast.error("No se pudo guardar el horario", {
        description: getCentroAtencionErrorMessage(error, "Error al guardar"),
      });
    }
  };

  const handleDelete = async (scheduleId: number) => {
    try {
      await deleteSchedule.mutateAsync({ scheduleId });
      toast.success("Horario eliminado");
    } catch (error) {
      toast.error("No se pudo eliminar el horario", {
        description: getCentroAtencionErrorMessage(error, "Error al eliminar"),
      });
    }
  };

  const schedules = data?.items ?? [];
  const isSaving = createSchedule.isPending || updateSchedule.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-txt-muted">
          {schedules.length} horario{schedules.length !== 1 ? "s" : ""} configurado{schedules.length !== 1 ? "s" : ""}
        </p>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Agregar horario
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-struct p-8 text-center">
          <p className="text-sm text-txt-muted">
            Sin horarios registrados para este centro.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between rounded-xl border border-line-struct bg-paper px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-txt-body">
                  {DIA_LABELS[schedule.weekDay]}
                </span>
                <span className="text-sm text-txt-muted">
                  {schedule.shift?.name ?? "-"}
                </span>
                <Badge variant={schedule.isActive ? "default" : "secondary"}>
                  {!schedule.isOpen
                    ? "Cerrado"
                    : schedule.is24Hours
                      ? "24h"
                      : `${schedule.openingTime?.slice(0, 5) ?? "-"} - ${schedule.closingTime?.slice(0, 5) ?? "-"}`}
                </Badge>
              </div>

              {canEdit && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(schedule)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleDelete(schedule.id)}
                    disabled={deleteSchedule.isPending}
                  >
                    <Trash2 className="size-4 text-status-critical" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? "Editar horario" : "Nuevo horario"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              id="horario-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="weekDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia</FormLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v) as DiaSemana)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.entries(DIA_LABELS) as [string, string][]).map(
                            ([val, label]) => (
                              <SelectItem key={val} value={val}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shiftId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno</FormLabel>
                      <FormControl>
                        <CatalogFkCombobox
                          options={turnosOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecciona un turno"
                          searchPlaceholder="Buscar turno..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-6">
                <FormField
                  control={form.control}
                  name="isOpen"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <Label>Abierto</Label>
                    </FormItem>
                  )}
                />

                {isOpen && (
                  <FormField
                    control={form.control}
                    name="is24Hours"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <Label>24 horas</Label>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {isOpen && !is24Hours && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="openingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora apertura</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="closingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora cierre</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Opcional"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="submit" form="horario-form" disabled={isSaving}>
              {isSaving ? "Guardando..." : editingSchedule ? "Guardar cambios" : "Crear horario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
