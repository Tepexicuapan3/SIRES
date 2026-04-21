import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, CalendarX2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
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
  centroAtencionExcepcionSchema,
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

const DEFAULT_EXCEPCION_VALUES: CentroAtencionExcepcionFormValues = {
  centerId: 0,
  date: "",
  tipo: "CERRADO",
  reason: "",
  openingTime: null,
  closingTime: null,
  isActive: true,
};

// =============================================================================
// HELPERS
// =============================================================================

function getTipoBadgeVariant(
  tipo: TipoExcepcion,
): "critical" | "alert" | "info" {
  if (tipo === "CERRADO") return "critical";
  if (tipo === "HORARIO_MODIFICADO") return "alert";
  return "info";
}

function groupByMonth(
  items: CentroAtencionExcepcionListItem[],
): Map<number, CentroAtencionExcepcionListItem[]> {
  const map = new Map<number, CentroAtencionExcepcionListItem[]>();
  for (const item of items) {
    const month = new Date(item.date + "T00:00:00").getMonth(); // 0-based
    if (!map.has(month)) map.set(month, []);
    map.get(month)!.push(item);
  }
  return map;
}

function formatExcepcionTime(item: CentroAtencionExcepcionListItem): string {
  if (item.tipo === "HORARIO_MODIFICADO" && item.openingTime && item.closingTime) {
    return `${item.openingTime.slice(0, 5)} - ${item.closingTime.slice(0, 5)}`;
  }
  return "";
}

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExcepcion, setEditingExcepcion] =
    useState<CentroAtencionExcepcionListItem | null>(null);

  const { data, isLoading } = useCentroAtencionExcepcionesList(
    { centerId, year: selectedYear, pageSize: 100 },
    { enabled: Boolean(centerId) },
  );

  const createExcepcion = useCreateCentroAtencionExcepcion();
  const updateExcepcion = useUpdateCentroAtencionExcepcion();
  const deleteExcepcion = useDeleteCentroAtencionExcepcion();

  const form = useForm<CentroAtencionExcepcionFormValues>({
    resolver: zodResolver(centroAtencionExcepcionSchema),
    defaultValues: DEFAULT_EXCEPCION_VALUES,
  });

  const tipoValue = form.watch("tipo");
  const isHorarioModificado = tipoValue === "HORARIO_MODIFICADO";

  const openCreate = () => {
    setEditingExcepcion(null);
    form.reset({ ...DEFAULT_EXCEPCION_VALUES, centerId });
    setDialogOpen(true);
  };

  const openEdit = (excepcion: CentroAtencionExcepcionListItem) => {
    setEditingExcepcion(excepcion);
    form.reset(
      mapCentroAtencionExcepcionToFormValues({
        ...excepcion,
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
    setEditingExcepcion(null);
    form.reset(DEFAULT_EXCEPCION_VALUES);
  };

  const handleSubmit = async (values: CentroAtencionExcepcionFormValues) => {
    try {
      if (editingExcepcion) {
        const payload = buildUpdateCentroAtencionExcepcionPayload(
          values,
          form.formState.dirtyFields as Partial<
            Record<keyof CentroAtencionExcepcionFormValues, boolean>
          >,
        );
        await updateExcepcion.mutateAsync({
          excepcionId: editingExcepcion.id,
          data: payload,
        });
        toast.success("Excepción actualizada");
      } else {
        const payload = buildCreateCentroAtencionExcepcionPayload(values);
        await createExcepcion.mutateAsync({ data: payload });
        toast.success("Excepción creada");
      }
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

  const allExcepciones = data?.items ?? [];
  const upcomingCount = allExcepciones.filter((e) => e.date >= TODAY).length;
  const grouped = groupByMonth(allExcepciones);
  const sortedMonths = Array.from(grouped.keys()).sort((a, b) => a - b);

  const isSaving = createExcepcion.isPending || updateExcepcion.isPending;

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

        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Agregar excepción
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : allExcepciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-struct p-8 text-center">
          <CalendarX2 className="mx-auto mb-3 size-8 text-txt-muted" />
          <p className="text-sm text-txt-muted">
            Sin excepciones registradas para {selectedYear}.
          </p>
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExcepcion ? "Editar excepción" : "Nueva excepción"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              id="excepcion-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v as TipoExcepcion)
                      }
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

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Describe el motivo de la excepción"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Times — only for HORARIO_MODIFICADO */}
              {isHorarioModificado && (
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
                            value={field.value?.slice(0, 5) ?? ""}
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
                            value={field.value?.slice(0, 5) ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
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
            <Button type="submit" form="excepcion-form" disabled={isSaving}>
              {isSaving
                ? "Guardando..."
                : editingExcepcion
                  ? "Guardar cambios"
                  : "Crear excepción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
