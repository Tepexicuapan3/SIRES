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
import { TipoPersonalDialogHeader } from "@features/admin/modules/catalogos/tipo-personal/components/TipoPersonalDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createTipoPersonalSchema,
  type CreateTipoPersonalFormValues,
} from "@features/admin/modules/catalogos/tipo-personal/domain/tipo-personal.schemas";
import { useCreateTipoPersonal } from "@features/admin/modules/catalogos/tipo-personal/mutations/useCreateTipoPersonal";
import { getTipoPersonalErrorMessage } from "@features/admin/modules/catalogos/tipo-personal/utils/tipo-personal.feedback";
import type { CreateTipoPersonalResponse } from "@api/types";

interface TipoPersonalCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateTipoPersonalFormValues = {
  name: "",
};

const FORM_ID = "tipo-personal-create-form";

export function TipoPersonalCreateDialog({
  open,
  onOpenChange,
}: TipoPersonalCreateDialogProps) {
  const [created, setCreated] = useState<CreateTipoPersonalResponse | null>(null);

  const createTipoPersonal = useCreateTipoPersonal();

  const form = useForm<CreateTipoPersonalFormValues>({
    resolver: zodResolver(createTipoPersonalSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateTipoPersonalFormValues) => {
    try {
      const result = await createTipoPersonal.mutateAsync({
        data: { name: values.name },
      });

      setCreated(result);
      toast.success("Tipo de personal creado", {
        description: `El tipo ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el tipo de personal", {
        description: getTipoPersonalErrorMessage(error, "Error al crear tipo de personal"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo tipo de personal</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo tipo de personal para el catalogo administrativo.
            </DialogDescription>
            <TipoPersonalDialogHeader
              title="Nuevo tipo de personal"
              subtitle="Configura el nombre del tipo de personal"
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
                          <FormLabel>Nombre del tipo de personal</FormLabel>
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
                  title="Tipo de personal creado"
                  description="El tipo de personal ya esta disponible en el catalogo."
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
                disabled={createTipoPersonal.isPending}
              >
                Crear tipo de personal
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
