import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { ScrollArea } from "@shared/ui/ScrollArea";
import { TipoResidenciaDialogHeader } from "@features/admin/modules/catalogos/tipos-residencia/components/TipoResidenciaDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createTipoResidenciaSchema,
  type CreateTipoResidenciaFormValues,
} from "@features/admin/modules/catalogos/tipos-residencia/domain/tipos-residencia.schemas";
import { useCreateTipoResidencia } from "@features/admin/modules/catalogos/tipos-residencia/mutations/useCreateTipoResidencia";
import { buildCreateTipoResidenciaPayload } from "@features/admin/modules/catalogos/tipos-residencia/utils/tipos-residencia.transform";
import { getTipoResidenciaErrorMessage } from "@features/admin/modules/catalogos/tipos-residencia/utils/tipos-residencia.feedback";
import type { CreateTipoResidenciaResponse } from "@api/types";

interface TipoResidenciaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateTipoResidenciaFormValues = { name: "" };
const FORM_ID = "tipo-residencia-create-form";

export function TipoResidenciaCreateDialog({ open, onOpenChange }: TipoResidenciaCreateDialogProps) {
  const [createdTipoResidencia, setCreatedTipoResidencia] = useState<CreateTipoResidenciaResponse | null>(null);
  const createTipoResidencia = useCreateTipoResidencia();

  const form = useForm<CreateTipoResidenciaFormValues>({
    resolver: zodResolver(createTipoResidenciaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedTipoResidencia(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateTipoResidenciaFormValues) => {
    try {
      const result = await createTipoResidencia.mutateAsync({ data: buildCreateTipoResidenciaPayload(values) });
      setCreatedTipoResidencia(result);
      toast.success("Tipo de residencia creado", { description: `El tipo de residencia ${result.name} se creo correctamente.` });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el tipo de residencia", {
        description: getTipoResidenciaErrorMessage(error, "Error al crear tipo de residencia"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo tipo de residencia</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo tipo de residencia para el catalogo administrativo.
            </DialogDescription>
            <TipoResidenciaDialogHeader
              title="Nuevo tipo de residencia"
              subtitle="Configura el nombre"
              status={<Badge variant="outline">Plantilla</Badge>}
            />
          </DialogHeader>

          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="space-y-6 pt-4">
              <div className="rounded-2xl border border-line-struct bg-paper p-4">
                <Form {...form}>
                  <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del tipo de residencia</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              {createdTipoResidencia ? (
                <CatalogCreateResultCard
                  title="Tipo de residencia creado"
                  description="El tipo de residencia ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdTipoResidencia.name },
                    { label: "ID", value: createdTipoResidencia.id },
                  ]}
                />
              ) : null}
            </div>
          </ScrollArea>

          <DialogFooter className="flex flex-col gap-3 border-t border-line-struct px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-txt-muted">Completa los campos requeridos.</div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>Cancelar</Button>
              <Button type="submit" form={FORM_ID} disabled={createTipoResidencia.isPending}>Crear tipo de residencia</Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
