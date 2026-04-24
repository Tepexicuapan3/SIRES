import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from "@shared/ui/ScrollArea";
import { CatalogFkCombobox } from "@features/admin/modules/catalogos/shared/components/CatalogFkCombobox";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import { InventarioDialogHeader } from "./InventarioDialogHeader";
import {
  createInventarioSchema,
  type CreateInventarioFormValues,
} from "../domain/inventario-vacunas.schemas";
import { useCreateInventario } from "../mutations/useCreateInventario";
import { getInventarioErrorMessage } from "../utils/inventario-vacunas.feedback";
import { useInventarioVacunasOptions } from "../queries/useInventarioVacunasOptions";
import type { CreateInventarioVacunaResponse } from "@api/types";

interface InventarioCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateInventarioFormValues = {
  vaccineId: 0,
  centerId: 0,
  stockQuantity: 0,
};

const FORM_ID = "inventario-create-form";

export function InventarioCreateDialog({ open, onOpenChange }: InventarioCreateDialogProps) {
  const [created, setCreated] = useState<CreateInventarioVacunaResponse | null>(null);

  const createInventario = useCreateInventario();
  const { vacunaOptions, centroOptions } = useInventarioVacunasOptions(open);

  const form = useForm<CreateInventarioFormValues>({
    resolver: zodResolver(createInventarioSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateInventarioFormValues) => {
    try {
      const result = await createInventario.mutateAsync({
        vaccineId: values.vaccineId,
        centerId: values.centerId,
        stockQuantity: values.stockQuantity,
      });

      setCreated(result);
      toast.success("Inventario registrado", {
        description: `${result.vaccine} en ${result.center} registrado correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo registrar el inventario", {
        description: getInventarioErrorMessage(error, "Error al crear registro"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo registro de inventario</DialogTitle>
            <DialogDescription className="sr-only">
              Registra la existencia inicial de una vacuna en un centro de atención.
            </DialogDescription>
            <InventarioDialogHeader
              title="Nuevo inventario"
              subtitle="Registra existencia de vacuna por centro"
              status={<Badge variant="outline">Plantilla</Badge>}
            />
          </DialogHeader>

          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="space-y-6 pt-4">
              <div className="rounded-2xl border border-line-struct bg-paper p-4">
                <Form {...form}>
                  <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Controller
                      control={form.control}
                      name="vaccineId"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Vacuna</FormLabel>
                          <FormControl>
                            <CatalogFkCombobox
                              options={vacunaOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecciona una vacuna"
                              searchPlaceholder="Buscar vacuna..."
                            />
                          </FormControl>
                          {fieldState.error ? (
                            <p className="text-sm text-status-critical">{fieldState.error.message}</p>
                          ) : null}
                        </FormItem>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="centerId"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Centro de atención</FormLabel>
                          <FormControl>
                            <CatalogFkCombobox
                              options={centroOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecciona un centro"
                              searchPlaceholder="Buscar centro..."
                            />
                          </FormControl>
                          {fieldState.error ? (
                            <p className="text-sm text-status-critical">{fieldState.error.message}</p>
                          ) : null}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad en existencia</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              {created ? (
                <CatalogCreateResultCard
                  title="Inventario registrado"
                  description="El registro ya está disponible en el módulo de farmacia."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Vacuna", value: created.vaccine },
                    { label: "Centro", value: created.center },
                    { label: "ID", value: created.id },
                  ]}
                />
              ) : null}
            </div>
          </ScrollArea>

          <DialogFooter className="flex flex-col gap-3 border-t border-line-struct px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-txt-muted">Completa los campos requeridos.</div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" form={FORM_ID} disabled={createInventario.isPending}>
                Registrar inventario
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
