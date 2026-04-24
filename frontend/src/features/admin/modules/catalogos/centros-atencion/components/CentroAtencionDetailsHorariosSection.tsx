import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { Badge } from "@shared/ui/badge";
import { Switch } from "@shared/ui/switch";
import { Input } from "@shared/ui/input";
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
  FormMessage,
} from "@shared/ui/form";
import {
  weekHorarioFormSchema,
  type WeekHorarioFormValues,
  type WeekDayRowFormValues,
} from "@features/admin/modules/catalogos/centros-atencion/domain/centros-atencion.schemas";
import { useCentroAtencionHorariosList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentroAtencionHorariosList";
import { useTurnosList } from "@features/admin/modules/catalogos/turnos/queries/useTurnosList";
import { CatalogFkCombobox } from "@features/admin/modules/catalogos/shared/components/CatalogFkCombobox";
import { useCreateCentroAtencionHorario } from "@features/admin/modules/catalogos/centros-atencion/mutations/useCreateCentroAtencionHorario";
import { useUpdateCentroAtencionHorario } from "@features/admin/modules/catalogos/centros-atencion/mutations/useUpdateCentroAtencionHorario";
import { useDeleteCentroAtencionHorario } from "@features/admin/modules/catalogos/centros-atencion/mutations/useDeleteCentroAtencionHorario";
import { getCentroAtencionErrorMessage } from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.feedback";
import type { DiaSemana } from "@api/types";

// =============================================================================
// CONSTANTS
// =============================================================================

const DIA_LABELS: Record<DiaSemana, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

const DIAS: DiaSemana[] = [1, 2, 3, 4, 5, 6, 7];

// =============================================================================
// HELPERS
// =============================================================================

const buildEmptyDays = (): WeekDayRowFormValues[] =>
  DIAS.map((d) => ({
    weekDay: d,
    existingId: undefined,
    isOpen: false,
    is24Hours: false,
    openingTime: null,
    closingTime: null,
    observations: null,
  }));

const normalizeTime = (value: string | null | undefined): string | null => {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value;
};

// =============================================================================
// COMPONENT
// =============================================================================

interface Props {
  centerId: number;
  canEdit: boolean;
}

export function CentroAtencionDetailsHorariosSection({
  centerId,
  canEdit,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useCentroAtencionHorariosList(
    { centerId, pageSize: 100 },
    { enabled: Boolean(centerId) },
  );

  const { data: turnosData } = useTurnosList({ pageSize: 100 });
  const turnosOptions = (turnosData?.items ?? []).map((t) => ({
    id: t.id,
    name: t.name,
  }));

  const createSchedule = useCreateCentroAtencionHorario();
  const updateSchedule = useUpdateCentroAtencionHorario();
  const deleteSchedule = useDeleteCentroAtencionHorario();

  const form = useForm<WeekHorarioFormValues>({
    resolver: zodResolver(weekHorarioFormSchema),
    defaultValues: { centerId, shiftId: 0, days: buildEmptyDays() },
  });

  const { fields } = useFieldArray({ control: form.control, name: "days" });
  const watchedShiftId = form.watch("shiftId");
  const watchedDays = form.watch("days");

  useEffect(() => {
    if (!watchedShiftId || watchedShiftId === 0) return;
    const existing = (data?.items ?? []).filter(
      (s) => s.shift?.id === watchedShiftId,
    );
    const days = DIAS.map((d) => {
      const found = existing.find((s) => s.weekDay === d);
      if (found) {
        return {
          weekDay: d,
          existingId: found.id,
          isOpen: found.isOpen,
          is24Hours: found.is24Hours,
          openingTime: found.openingTime ? found.openingTime.slice(0, 5) : null,
          closingTime: found.closingTime ? found.closingTime.slice(0, 5) : null,
          observations: null,
        };
      }
      return {
        weekDay: d,
        existingId: undefined,
        isOpen: false,
        is24Hours: false,
        openingTime: null,
        closingTime: null,
        observations: null,
      };
    });
    form.setValue("days", days);
  }, [watchedShiftId, data?.items]);

  const openDialog = (preloadShiftId?: number) => {
    form.reset({ centerId, shiftId: preloadShiftId ?? 0, days: buildEmptyDays() });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    form.reset({ centerId, shiftId: 0, days: buildEmptyDays() });
  };

  const handleSubmit = async (values: WeekHorarioFormValues) => {
    const ops = values.days.map((day) => {
      const openingTime =
        day.isOpen && !day.is24Hours ? normalizeTime(day.openingTime) : null;
      const closingTime =
        day.isOpen && !day.is24Hours ? normalizeTime(day.closingTime) : null;

      if (day.existingId) {
        return updateSchedule.mutateAsync({
          scheduleId: day.existingId,
          data: {
            isOpen: day.isOpen,
            is24Hours: day.is24Hours,
            openingTime,
            closingTime,
            observations: day.observations ?? null,
          },
        });
      }

      return createSchedule.mutateAsync({
        data: {
          centerId: values.centerId,
          shiftId: values.shiftId,
          weekDay: day.weekDay as DiaSemana,
          isOpen: day.isOpen,
          is24Hours: day.is24Hours,
          openingTime,
          closingTime,
          observations: day.observations ?? null,
          isActive: true,
        },
      });
    });

    const results = await Promise.allSettled(ops);
    const failed = results.filter((r) => r.status === "rejected");

    if (failed.length === 0) {
      toast.success("Horario semanal guardado");
    } else {
      toast.warning(
        `${results.length - failed.length} de ${results.length} días guardados correctamente`,
      );
    }
    closeDialog();
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

  const groupedByShift = schedules.reduce<
    Map<number, { shiftName: string; days: typeof schedules }>
  >((acc, s) => {
    const sid = s.shift?.id ?? 0;
    if (!acc.has(sid))
      acc.set(sid, { shiftName: s.shift?.name ?? "Sin turno", days: [] });
    acc.get(sid)!.days.push(s);
    return acc;
  }, new Map());

  const isSaving = createSchedule.isPending || updateSchedule.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-txt-muted">
          {schedules.length} horario{schedules.length !== 1 ? "s" : ""}{" "}
          configurado{schedules.length !== 1 ? "s" : ""}
        </p>
        {canEdit && (
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="mr-2 size-4" />
            Configurar turno
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
        <div className="space-y-4">
          {Array.from(groupedByShift.entries()).map(
            ([sid, { shiftName, days }]) => (
              <div
                key={sid}
                className="overflow-hidden rounded-xl border border-line-struct"
              >
                <div className="flex items-center justify-between bg-surface-subtle px-4 py-2">
                  <span className="text-sm font-semibold">{shiftName}</span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDialog(sid)}
                    >
                      <Pencil className="mr-1 size-3.5" />
                      Editar semana
                    </Button>
                  )}
                </div>

                <div className="divide-y divide-line-struct">
                  {DIAS.map((dia) => {
                    const schedule = days.find((s) => s.weekDay === dia);
                    return (
                      <div
                        key={dia}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-24 text-sm font-medium text-txt-body">
                            {DIA_LABELS[dia]}
                          </span>
                          {schedule ? (
                            <Badge
                              variant={
                                !schedule.isOpen ? "secondary" : "default"
                              }
                            >
                              {!schedule.isOpen
                                ? "Cerrado"
                                : schedule.is24Hours
                                  ? "24h"
                                  : `${schedule.openingTime?.slice(0, 5) ?? "-"} - ${schedule.closingTime?.slice(0, 5) ?? "-"}`}
                            </Badge>
                          ) : (
                            <span className="text-xs text-txt-muted opacity-50">
                              No configurado
                            </span>
                          )}
                        </div>

                        {canEdit && schedule && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleDelete(schedule.id)}
                            disabled={deleteSchedule.isPending}
                          >
                            <Trash2 className="size-4 text-status-critical" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Week grid dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar horario semanal</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              id="week-horario-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="shiftId"
                render={({ field }) => (
                  <FormItem>
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

              {/* 7-day grid */}
              <div className="overflow-hidden rounded-xl border border-line-struct">
                <div className="grid grid-cols-[7rem_2.5rem_2.5rem_1fr_1fr] gap-x-3 bg-surface-subtle px-4 py-2 text-xs font-medium uppercase tracking-wide text-txt-muted">
                  <span>Día</span>
                  <span className="text-center">Abierto</span>
                  <span className="text-center">24h</span>
                  <span>Apertura</span>
                  <span>Cierre</span>
                </div>

                <div className="divide-y divide-line-struct">
                  {fields.map((field, index) => {
                    const dayIsOpen = watchedDays[index]?.isOpen ?? false;
                    const dayIs24h = watchedDays[index]?.is24Hours ?? false;

                    return (
                      <div
                        key={field.id}
                        className="grid grid-cols-[7rem_2.5rem_2.5rem_1fr_1fr] items-center gap-x-3 px-4 py-2.5"
                      >
                        <span className="text-sm font-medium text-txt-body">
                          {DIA_LABELS[field.weekDay as DiaSemana]}
                        </span>

                        <div className="flex justify-center">
                          <FormField
                            control={form.control}
                            name={`days.${index}.isOpen`}
                            render={({ field: f }) => (
                              <Switch
                                checked={f.value}
                                onCheckedChange={(checked) => {
                                  f.onChange(checked);
                                  if (!checked) {
                                    form.setValue(`days.${index}.is24Hours`, false);
                                    form.setValue(`days.${index}.openingTime`, null);
                                    form.setValue(`days.${index}.closingTime`, null);
                                  }
                                }}
                              />
                            )}
                          />
                        </div>

                        <div className="flex justify-center">
                          <FormField
                            control={form.control}
                            name={`days.${index}.is24Hours`}
                            render={({ field: f }) => (
                              <Switch
                                checked={f.value}
                                disabled={!dayIsOpen}
                                onCheckedChange={(checked) => {
                                  f.onChange(checked);
                                  if (checked) {
                                    form.setValue(`days.${index}.openingTime`, null);
                                    form.setValue(`days.${index}.closingTime`, null);
                                  }
                                }}
                              />
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`days.${index}.openingTime`}
                          render={({ field: f }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Input
                                  type="time"
                                  value={f.value ?? ""}
                                  onChange={(e) =>
                                    f.onChange(e.target.value || null)
                                  }
                                  disabled={!dayIsOpen || dayIs24h}
                                  className="h-8 text-sm"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`days.${index}.closingTime`}
                          render={({ field: f }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Input
                                  type="time"
                                  value={f.value ?? ""}
                                  onChange={(e) =>
                                    f.onChange(e.target.value || null)
                                  }
                                  disabled={!dayIsOpen || dayIs24h}
                                  className="h-8 text-sm"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          </Form>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="submit" form="week-horario-form" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar horario semanal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
