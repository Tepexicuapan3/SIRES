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
import { OcupacionDialogHeader } from "@features/admin/modules/catalogos/ocupaciones/components/OcupacionDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createOcupacionSchema,
  type CreateOcupacionFormValues,
} from "@features/admin/modules/catalogos/ocupaciones/domain/ocupaciones.schemas";
import { useCreateOcupacion } from "@features/admin/modules/catalogos/ocupaciones/mutations/useCreateOcupacion";
import { getOcupacionErrorMessage } from "@features/admin/modules/catalogos/ocupaciones/utils/ocupaciones.feedback";
import type { CreateOcupacionResponse } from "@api/types";

interface OcupacionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateOcupacionFormValues = {
  name: "",
};

const FORM_ID = "ocupacion-create-form";

export function OcupacionCreateDialog({
  open,
  onOpenChange,
}: OcupacionCreateDialogProps) {
  const [created, setCreated] = useState<CreateOcupacionResponse | null>(null);

  const createOcupacion = useCreateOcupacion();

  const form = useForm<CreateOcupacionFormValues>({
    resolver: zodResolver(createOcupacionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateOcupacionFormValues) => {
    try {
      const result = await createOcupacion.mutateAsync({
        data: { name: values.name },
      });

      setCreated(result);
      toast.success("Ocupacion creada", {
        description: `La ocupacion ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la ocupacion", {
        description: getOcupacionErrorMessage(error, "Error al crear ocupacion"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva ocupacion</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva ocupacion para el catalogo administrativo.
            </DialogDescription>
            <OcupacionDialogHeader
              title="Nueva ocupacion"
              subtitle="Configura el nombre de la ocupacion"
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
                          <FormLabel>Nombre de la ocupacion</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                  title="Ocupacion creada"
                  description="La ocupacion ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: created.name },
                    { label: "ID", value: created.id },
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
                disabled={createOcupacion.isPending}
              >
                Crear ocupacion
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
