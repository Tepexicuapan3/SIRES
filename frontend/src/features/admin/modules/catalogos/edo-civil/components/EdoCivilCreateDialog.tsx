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
import { EdoCivilDialogHeader } from "@features/admin/modules/catalogos/edo-civil/components/EdoCivilDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createEdoCivilSchema,
  type CreateEdoCivilFormValues,
} from "@features/admin/modules/catalogos/edo-civil/domain/edoCivil.schemas";
import { useCreateEdoCivil } from "@features/admin/modules/catalogos/edo-civil/mutations/useCreateEdoCivil";
import { buildCreateEdoCivilPayload } from "@features/admin/modules/catalogos/edo-civil/utils/edoCivil.transform";
import { getEdoCivilErrorMessage } from "@features/admin/modules/catalogos/edo-civil/utils/edoCivil.feedback";
import type { CreateEdoCivilResponse } from "@api/types";

interface EdoCivilCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateEdoCivilFormValues = {
  name: "",
};

const FORM_ID = "edo-civil-create-form";

export function EdoCivilCreateDialog({
  open,
  onOpenChange,
}: EdoCivilCreateDialogProps) {
  const [createdEdoCivil, setCreatedEdoCivil] =
    useState<CreateEdoCivilResponse | null>(null);
  const createEdoCivil = useCreateEdoCivil();

  const form = useForm<CreateEdoCivilFormValues>({
    resolver: zodResolver(createEdoCivilSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedEdoCivil(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateEdoCivilFormValues) => {
    try {
      const result = await createEdoCivil.mutateAsync({
        data: buildCreateEdoCivilPayload(values),
      });

      setCreatedEdoCivil(result);
      toast.success("Estado civil creado", {
        description: `El estado civil ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el estado civil", {
        description: getEdoCivilErrorMessage(error, "Error al crear estado civil"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo estado civil</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo estado civil para el catalogo administrativo.
            </DialogDescription>
            <EdoCivilDialogHeader
              title="Nuevo estado civil"
              subtitle="Configura el nombre"
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
                            <FormLabel>Nombre del estado civil</FormLabel>
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

              {createdEdoCivil ? (
                <CatalogCreateResultCard
                  title="Estado civil creado"
                  description="El estado civil ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdEdoCivil.name },
                    { label: "ID", value: createdEdoCivil.id },
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
                disabled={createEdoCivil.isPending}
              >
                Crear estado civil
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
