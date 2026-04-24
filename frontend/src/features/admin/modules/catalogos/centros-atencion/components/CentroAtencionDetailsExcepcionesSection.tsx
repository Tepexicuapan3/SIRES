import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, CalendarX2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import { Calendar } from "@shared/ui/calendar";
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
import {
  bulkExcepcionFormSchema,
  centroAtencionExcepcionSchema,
  type BulkExcepcionFormValues,
  type CentroAtencionExcepcionFormValues,
} from "@features/admin/modules/catalogos/centros-atencion/domain/centros-atencion.schemas";
import { useCentroAtencionExcepcionesList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentroAtencionExcepcionesList";
import { useCreateCentroAtencionExcepcion } from "@features/admin/modules/catalogos/centros-atencion/mutations/useCreateCentroAtencionExcepcion";
import { useUpdateCentroAtencionExcepcion } from "@features/admin/modules/catalogos/centros-atencion/mutations/useUpdateCentroAtencionExcepcion";
import { useDeleteCentroAtencionExcepcion } from "@features/admin/modules/catalogos/centros-atencion/mutations/useDeleteCentroAtencionExcepcion";
import { getCentroAtencionErrorMessage } from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.feedback";
import {
  buildCreateCentroAtencionExcepcionPayload,
  buildUpdateCentroAtencionExcepcionPayload,
  mapCentroAtencionExcepcionToFormValues,
} from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.transform";
import type {
  CentroAtencionExcepcionListItem,
  TipoExcepcion,
} from "@api/types";

// =============================================================================
// CONSTANTS
// =============================================================================

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i);

const TIPO_LABELS: Record<TipoExcepcion, string> = {
  CERRADO: "Cerrado",
  HORARIO_MODIFICADO: "Horario modificado",
  AVISO: "Aviso",
};

const TIPO_OPTIONS: TipoExcepcion[] = ["CERRADO", "HORARIO_MODIFICADO", "AVISO"];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const TODAY = new Date().toISOString().slice(0, 10);

// =============================================================================
// HELPERS
// =============================================================================

function getTipoBadgeVariant(tipo: TipoExcepcion): "critical" | "alert" | "info" {
  if (tipo === "CERRADO") return "critical";
  if (tipo === "HORARIO_MODIFICADO") return "alert";
  return "info";
}

function groupByMonth(
  items: CentroAtencionExcepcionListItem[],
): Map<number, CentroAtencionExcepcionListItem[]> {
  const map = new Map<number, CentroAtencionExcepcionListItem[]>();
  for (const item of items) {
    const month = new Date(item.date + "T00:00:00").getMonth();
    if (!map.has(month)) map.set(month, []);
    map.get(month)!.push(item);
  }
  return map;
}

function toDateObj(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatExcepcionTime(item: CentroAtencionExcepcionListItem): string {
  if (item.tipo === "HORARIO_MODIFICADO" && item.openingTime && item.closingTime) {
    return `${item.openingTime.slice(0, 5)} - ${item.closingTime.slice(0, 5)}`;
  }
  return "";
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_BULK_VALUES = (centerId: number): BulkExcepcionFormValues => ({
  centerId,
  dates: [],
  tipo: "CERRADO",
  reason: "",
  openingTime: null,
  closingTime: null,
  isActive: true,
});

const DEFAULT_EDIT_VALUES = (centerId: number): CentroAtencionExcepcionFormValues => ({
  centerId,
  date: "",
  tipo: "CERRADO",
  reason: "",
  openingTime: null,
  closingTime: null,
  isActive: true,
});

// =============================================================================
// COMPONENT
// =============================================================================

interface Props {
  centerId: number;
  canEdit: boolean;
}

export function CentroAtencionDetailsExcepcionesSection({
  centerId,
  canEdit,
}: Props) {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  // "bulk" = crear nuevas con multi-selección, "edit" = editar existente
  const [mode, setMode] = useState<"bulk" | "edit" | null>(null);
  const [editingExcepcion, setEditingExcepcion] =
    useState<CentroAtencionExcepcionListItem | null>(null);
  // Dates selected in calendar for bulk create
  const [calendarSelected, setCalendarSelected] = useState<Date[] | undefined>(undefined);

  const { data, isLoading } = useCentroAtencionExcepcionesList(
    { centerId, year: selectedYear, pageSize: 100 },
    { enabled: Boolean(centerId) },
  );

  const createExcepcion = useCreateCentroAtencionExcepcion();
  const updateExcepcion = useUpdateCentroAtencionExcepcion();
  const deleteExcepcion = useDeleteCentroAtencionExcepcion();

  // Form for bulk creation (multiple dates)
  const bulkForm = useForm<BulkExcepcionFormValues>({
    resolver: zodResolver(bulkExcepcionFormSchema),
    defaultValues: DEFAULT_BULK_VALUES(centerId),
  });

  // Form for single edit
  const editForm = useForm<CentroAtencionExcepcionFormValues>({
    resolver: zodResolver(centroAtencionExcepcionSchema),
    defaultValues: DEFAULT_EDIT_VALUES(centerId),
  });

  const bulkTipo = bulkForm.watch("tipo");
  const editTipo = editForm.watch("tipo");

  const allExcepciones = data?.items ?? [];
  const upcomingCount = allExcepciones.filter((e) => e.date >= TODAY).length;
  const grouped = groupByMonth(allExcepciones);
  const sortedMonths = Array.from(grouped.keys()).sort((a, b) => a - b);

  // Set of existing exception date strings for the current year
  const exceptionDateStrings = new Set(allExcepciones.map((e) => e.date));

  // Map date string → excepcion (for calendar click on existing)
  const exceptionByDate = new Map(allExcepciones.map((e) => [e.date, e]));

  // react-day-picker modifiers
  const modifiers = {
    cerrado: allExcepciones
      .filter((e) => e.tipo === "CERRADO")
      .map((e) => toDateObj(e.date)),
    horarioModificado: allExcepciones
      .filter((e) => e.tipo === "HORARIO_MODIFICADO")
      .map((e) => toDateObj(e.date)),
    aviso: allExcepciones
      .filter((e) => e.tipo === "AVISO")
      .map((e) => toDateObj(e.date)),
  };

  // Handle calendar day click
  const handleCalendarSelect = (dates: Date[] | undefined) => {
    if (!canEdit) return;
    setCalendarSelected(dates);

    if (!dates || dates.length === 0) return;

    // If the last selected date is an existing exception → open edit dialog
    const lastDate = dates[dates.length - 1];
    const lastDateStr = toDateStr(lastDate);
    const existing = exceptionByDate.get(lastDateStr);

    if (existing && dates.length === 1) {
      // Single click on existing → edit mode
      openEdit(existing);
      setCalendarSelected(undefined);
      return;
    }

    // Otherwise → update bulk form dates
    const newDateStrings = (dates ?? [])
      .map(toDateStr)
      .filter((d) => !exceptionDateStrings.has(d)); // exclude existing
    bulkForm.setValue("dates", newDateStrings);
    if (newDateStrings.length > 0 && mode !== "bulk") {
      setMode("bulk");
    }
  };

  const openEdit = (excepcion: CentroAtencionExcepcionListItem) => {
    setEditingExcepcion(excepcion);
    editForm.reset(
      mapCentroAtencionExcepcionToFormValues({
        ...excepcion,
        createdAt: "",
        createdBy: null,
        updatedAt: null,
        updatedBy: null,
      }),
    );
    setMode("edit");
  };

  const closeDialog = () => {
    setMode(null);
    setEditingExcepcion(null);
    setCalendarSelected(undefined);
    bulkForm.reset(DEFAULT_BULK_VALUES(centerId));
    editForm.reset(DEFAULT_EDIT_VALUES(centerId));
  };

  const handleBulkSubmit = async (values: BulkExcepcionFormValues) => {
    const ops = values.dates.map((date) =>
      createExcepcion.mutateAsync({
        data: buildCreateCentroAtencionExcepcionPayload({
          ...values,
          date,
        }),
      }),
    );

    const results = await Promise.allSettled(ops);
    const failed = results.filter((r) => r.status === "rejected");

    if (failed.length === 0) {
      toast.success(
        `${results.length} excepción${results.length !== 1 ? "es" : ""} creada${results.length !== 1 ? "s" : ""}`,
      );
    } else {
      toast.warning(
        `${results.length - failed.length} de ${results.length} excepciones creadas`,
      );
    }
    closeDialog();
  };

  const handleEditSubmit = async (values: CentroAtencionExcepcionFormValues) => {
    if (!editingExcepcion) return;
    try {
      const payload = buildUpdateCentroAtencionExcepcionPayload(
        values,
        editForm.formState.dirtyFields as Partial<
          Record<keyof CentroAtencionExcepcionFormValues, boolean>
        >,
      );
      await updateExcepcion.mutateAsync({
        excepcionId: editingExcepcion.id,
        data: payload,
      });
      toast.success("Excepción actualizada");
      closeDialog();
    } catch (error) {
      toast.error("No se pudo guardar la excepción", {
        description: getCentroAtencionErrorMessage(error, "Error al guardar"),
      });
    }
  };

  const handleDelete = async (excepcionId: number) => {
    try {
      await deleteExcepcion.mutateAsync({ excepcionId });
      toast.success("Excepción eliminada");
    } catch (error) {
      toast.error("No se pudo eliminar la excepción", {
        description: getCentroAtencionErrorMessage(error, "Error al eliminar"),
      });
    }
  };

  const isBulkSaving = createExcepcion.isPending;
  const isEditSaving = updateExcepcion.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-txt-muted">
            {upcomingCount > 0
              ? `${upcomingCount} excepción${upcomingCount !== 1 ? "es" : ""} próxima${upcomingCount !== 1 ? "s" : ""}`
              : "Sin excepciones próximas"}
          </p>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="h-7 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <div className="rounded-xl border border-line-struct bg-paper p-2">
          {/* Legend */}
          <div className="mb-2 flex flex-wrap items-center gap-3 px-2 text-xs text-txt-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-full bg-status-critical" />
              Cerrado
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-full bg-status-warning" />
              Horario modificado
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-full bg-status-info" />
              Aviso
            </span>
            {canEdit && (
              <span className="ml-auto text-xs text-txt-muted">
                Seleccioná fechas nuevas para crear excepciones • Clic en fecha existente para editar
              </span>
            )}
          </div>

          <Calendar
            mode="multiple"
            selected={calendarSelected}
            onSelect={handleCalendarSelect}
            defaultMonth={new Date(selectedYear, new Date().getMonth())}
            fromYear={selectedYear}
            toYear={selectedYear}
            modifiers={modifiers}
            modifiersClassNames={{
              cerrado: "after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-status-critical after:content-[''] relative",
              horarioModificado: "after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-status-warning after:content-[''] relative",
              aviso: "after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-status-info after:content-[''] relative",
            }}
            disabled={!canEdit}
            className="w-full"
            captionLayout="dropdown"
          />
        </div>
      )}

      {/* List grouped by month */}
      {!isLoading && allExcepciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-struct p-8 text-center">
          <CalendarX2 className="mx-auto mb-3 size-8 text-txt-muted" />
          <p className="text-sm text-txt-muted">
            Sin excepciones registradas para {selectedYear}.
          </p>
          {canEdit && (
            <p className="mt-1 text-xs text-txt-muted">
              Seleccioná una o varias fechas en el calendario para agregar excepciones.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {sortedMonths.map((month) => {
            const items = grouped.get(month) ?? [];
            return (
              <div key={month}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-txt-muted">
                  {MONTH_NAMES[month]}
                </p>
                <div className="space-y-2">
                  {items.map((excepcion) => {
                    const isPast = excepcion.date < TODAY;
                    return (
                      <div
                        key={excepcion.id}
                        className={`flex items-center justify-between rounded-xl border border-line-struct bg-paper px-4 py-3 transition-opacity ${isPast ? "opacity-50" : ""}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="w-24 shrink-0 text-sm font-medium tabular-nums text-txt-body">
                            {excepcion.date.slice(5).replace("-", "/")}
                          </span>
                          <Badge variant={getTipoBadgeVariant(excepcion.tipo)}>
                            {TIPO_LABELS[excepcion.tipo]}
                          </Badge>
                          {formatExcepcionTime(excepcion) && (
                            <span className="text-xs text-txt-muted">
                              {formatExcepcionTime(excepcion)}
                            </span>
                          )}
                          <span className="truncate text-sm text-txt-muted">
                            {excepcion.reason}
                          </span>
                        </div>

                        {canEdit && (
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(excepcion)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void handleDelete(excepcion.id)}
                              disabled={deleteExcepcion.isPending}
                            >
                              <Trash2 className="size-4 text-status-critical" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BULK CREATE DIALOG */}
      <Dialog open={mode === "bulk"} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva excepción</DialogTitle>
          </DialogHeader>

          <Form {...bulkForm}>
            <form
              id="bulk-excepcion-form"
              onSubmit={bulkForm.handleSubmit(handleBulkSubmit)}
              className="space-y-4"
            >
              {/* Selected dates chips */}
              <FormField
                control={bulkForm.control}
                name="dates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fechas seleccionadas</FormLabel>
                    <div className="flex min-h-10 flex-wrap gap-1.5 rounded-lg border border-line-struct bg-surface-subtle px-3 py-2">
                      {field.value.length === 0 ? (
                        <span className="text-xs text-txt-muted">
                          Seleccioná fechas en el calendario
                        </span>
                      ) : (
                        field.value.map((d) => (
                          <span
                            key={d}
                            className="flex items-center gap-1 rounded-md bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand"
                          >
                            {d.slice(5).replace("-", "/")}
                            <button
                              type="button"
                              onClick={() =>
                                field.onChange(field.value.filter((x) => x !== d))
                              }
                              className="ml-0.5 opacity-60 hover:opacity-100"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bulkForm.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v as TipoExcepcion);
                        if (v !== "HORARIO_MODIFICADO") {
                          bulkForm.setValue("openingTime", null);
                          bulkForm.setValue("closingTime", null);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPO_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIPO_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bulkForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Describe el motivo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {bulkTipo === "HORARIO_MODIFICADO" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={bulkForm.control}
                    name="openingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora apertura</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            value={field.value?.slice(0, 5) ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bulkForm.control}
                    name="closingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora cierre</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            value={field.value?.slice(0, 5) ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </form>
          </Form>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="bulk-excepcion-form"
              disabled={isBulkSaving || bulkForm.watch("dates").length === 0}
            >
              {isBulkSaving
                ? "Guardando..."
                : `Crear ${bulkForm.watch("dates").length > 1 ? `${bulkForm.watch("dates").length} excepciones` : "excepción"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={mode === "edit"} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar excepción{" "}
              {editingExcepcion
                ? `— ${editingExcepcion.date.slice(5).replace("-", "/")}`
                : ""}
            </DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form
              id="edit-excepcion-form"
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v as TipoExcepcion);
                        if (v !== "HORARIO_MODIFICADO") {
                          editForm.setValue("openingTime", null);
                          editForm.setValue("closingTime", null);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPO_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIPO_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Describe el motivo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editTipo === "HORARIO_MODIFICADO" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="openingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora apertura</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            value={field.value?.slice(0, 5) ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="closingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora cierre</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            value={field.value?.slice(0, 5) ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </form>
          </Form>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-excepcion-form"
              disabled={isEditSaving}
            >
              {isEditSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
