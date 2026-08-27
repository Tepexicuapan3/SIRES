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
import { DiscapacidadDialogHeader } from "@features/admin/modules/catalogos/discapacidades/components/DiscapacidadDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createDiscapacidadSchema,
  type CreateDiscapacidadFormValues,
} from "@features/admin/modules/catalogos/discapacidades/domain/discapacidades.schemas";
import { useCreateDiscapacidad } from "@features/admin/modules/catalogos/discapacidades/mutations/useCreateDiscapacidad";
import { buildCreateDiscapacidadPayload } from "@features/admin/modules/catalogos/discapacidades/utils/discapacidades.transform";
import { getDiscapacidadErrorMessage } from "@features/admin/modules/catalogos/discapacidades/utils/discapacidades.feedback";
import type { CreateDiscapacidadResponse } from "@api/types";

interface DiscapacidadCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateDiscapacidadFormValues = {
  name: "",
  code: "",
};

const FORM_ID = "discapacidad-create-form";

export function DiscapacidadCreateDialog({
  open,
  onOpenChange,
}: DiscapacidadCreateDialogProps) {
  const [createdDiscapacidad, setCreatedDiscapacidad] =
    useState<CreateDiscapacidadResponse | null>(null);
  const createDiscapacidad = useCreateDiscapacidad();

  const form = useForm<CreateDiscapacidadFormValues>({
    resolver: zodResolver(createDiscapacidadSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedDiscapacidad(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateDiscapacidadFormValues) => {
    try {
      const result = await createDiscapacidad.mutateAsync({
        data: buildCreateDiscapacidadPayload(values),
      });

      setCreatedDiscapacidad(result);
      toast.success("Discapacidad creada", {
        description: `La discapacidad ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la discapacidad", {
        description: getDiscapacidadErrorMessage(error, "Error al crear discapacidad"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva discapacidad</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva discapacidad para el catalogo administrativo.
            </DialogDescription>
            <DiscapacidadDialogHeader
              title="Nueva discapacidad"
              subtitle="Configura nombre y clave"
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
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de la discapacidad</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clave</FormLabel>
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

              {createdDiscapacidad ? (
                <CatalogCreateResultCard
                  title="Discapacidad creada"
                  description="La discapacidad ya esta disponible en el catalogo."
                  badgeLabel="Activa"
                  fields={[
                    { label: "Nombre", value: createdDiscapacidad.name },
                    { label: "Clave", value: createdDiscapacidad.code },
                    { label: "ID", value: createdDiscapacidad.id },
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
                disabled={createDiscapacidad.isPending}
              >
                Crear discapacidad
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
