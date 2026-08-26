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
import { CalidadLaboralDialogHeader } from "@features/admin/modules/catalogos/calidad-laboral/components/CalidadLaboralDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createCalidadLaboralSchema,
  type CreateCalidadLaboralFormValues,
} from "@features/admin/modules/catalogos/calidad-laboral/domain/calidadLaboral.schemas";
import { buildCreateCalidadLaboralPayload } from "@features/admin/modules/catalogos/calidad-laboral/utils/calidadLaboral.transform";
import { useCreateCalidadLaboral } from "@features/admin/modules/catalogos/calidad-laboral/mutations/useCreateCalidadLaboral";
import { getCalidadLaboralErrorMessage } from "@features/admin/modules/catalogos/calidad-laboral/utils/calidadLaboral.feedback";
import type { CreateCalidadLaboralResponse } from "@api/types";

interface CalidadLaboralCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateCalidadLaboralFormValues = {
  id: "",
  name: "",
};

const FORM_ID = "calidad-laboral-create-form";

export function CalidadLaboralCreateDialog({
  open,
  onOpenChange,
}: CalidadLaboralCreateDialogProps) {
  const [created, setCreated] = useState<CreateCalidadLaboralResponse | null>(null);

  const createCalidadLaboral = useCreateCalidadLaboral();

  const form = useForm<CreateCalidadLaboralFormValues>({
    resolver: zodResolver(createCalidadLaboralSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateCalidadLaboralFormValues) => {
    try {
      const result = await createCalidadLaboral.mutateAsync({
        data: buildCreateCalidadLaboralPayload(values),
      });

      setCreated(result);
      toast.success("Calidad laboral creada", {
        description: `La calidad laboral ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la calidad laboral", {
        description: getCalidadLaboralErrorMessage(error, "Error al crear calidad laboral"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva calidad laboral</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva calidad laboral para el catalogo administrativo.
            </DialogDescription>
            <CalidadLaboralDialogHeader
              title="Nueva calidad laboral"
              subtitle="Configura el codigo y el nombre de la calidad laboral"
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Codigo</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={2} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </div>

              {created ? (
                <CatalogCreateResultCard
                  title="Calidad laboral creada"
                  description="La calidad laboral ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Codigo", value: created.id },
                    { label: "Nombre", value: created.name },
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
                disabled={createCalidadLaboral.isPending}
              >
                Crear calidad laboral
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
