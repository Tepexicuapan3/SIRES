import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { EspecialidadDialogHeader } from "@features/admin/modules/catalogos/especialidades/components/EspecialidadDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createEspecialidadSchema,
  type CreateEspecialidadFormValues,
} from "@features/admin/modules/catalogos/especialidades/domain/especialidades.schemas";
import { useCreateEspecialidad } from "@features/admin/modules/catalogos/especialidades/mutations/useCreateEspecialidad";
import { buildCreateEspecialidadPayload } from "@features/admin/modules/catalogos/especialidades/utils/especialidades.transform";
import { getEspecialidadErrorMessage } from "@features/admin/modules/catalogos/especialidades/utils/especialidades.feedback";
import type { CreateEspecialidadResponse } from "@api/types";

interface EspecialidadCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateEspecialidadFormValues = {
  name: "",
};

const FORM_ID = "especialidad-create-form";

export function EspecialidadCreateDialog({
  open,
  onOpenChange,
}: EspecialidadCreateDialogProps) {
  const [createdEspecialidad, setCreatedEspecialidad] =
    useState<CreateEspecialidadResponse | null>(null);
  const createEspecialidad = useCreateEspecialidad();

  const form = useForm<CreateEspecialidadFormValues>({
    resolver: zodResolver(createEspecialidadSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedEspecialidad(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateEspecialidadFormValues) => {
    try {
      const result = await createEspecialidad.mutateAsync({
        data: buildCreateEspecialidadPayload(values),
      });

      setCreatedEspecialidad(result);
      toast.success("Especialidad creada", {
        description: `La especialidad ${result.name} se creó correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la especialidad", {
        description: getEspecialidadErrorMessage(
          error,
          "Error al crear especialidad",
        ),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva especialidad</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva especialidad para el catálogo administrativo.
            </DialogDescription>
            <EspecialidadDialogHeader
              title="Nueva especialidad"
              subtitle="Ingresa el nombre de la especialidad"
              status={<Badge variant="outline">Plantilla</Badge>}
            />
          </DialogHeader>

          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="space-y-6 pt-4">
              <div className="rounded-2xl border border-line-struct bg-paper p-4">
                <Form {...form}>
                  <form
                    id={FORM_ID}
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la especialidad</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ej. Medicina General, Pediatría..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              {createdEspecialidad ? (
                <CatalogCreateResultCard
                  title="Especialidad creada"
                  description="La especialidad ya está disponible en el catálogo."
                  badgeLabel="Activa"
                  fields={[
                    { label: "Nombre", value: createdEspecialidad.name },
                    { label: "ID", value: createdEspecialidad.id },
                  ]}
                />
              ) : null}
            </div>
          </ScrollArea>

          <DialogFooter className="flex flex-col gap-3 border-t border-line-struct px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-txt-muted">
              Completa los campos requeridos.
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form={FORM_ID}
                disabled={createEspecialidad.isPending}
              >
                Crear especialidad
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
