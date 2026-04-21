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
import { EscuelaDialogHeader } from "@features/admin/modules/catalogos/escuelas/components/EscuelaDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createEscuelaSchema,
  type CreateEscuelaFormValues,
} from "@features/admin/modules/catalogos/escuelas/domain/escuelas.schemas";
import { useCreateEscuela } from "@features/admin/modules/catalogos/escuelas/mutations/useCreateEscuela";
import { buildCreateEscuelaPayload } from "@features/admin/modules/catalogos/escuelas/utils/escuelas.transform";
import { getEscuelaErrorMessage } from "@features/admin/modules/catalogos/escuelas/utils/escuelas.feedback";
import type { CreateEscuelaResponse } from "@api/types";

interface EscuelaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateEscuelaFormValues = {
  name: "",
  code: "",
};

const FORM_ID = "escuela-create-form";

export function EscuelaCreateDialog({
  open,
  onOpenChange,
}: EscuelaCreateDialogProps) {
  const [createdEscuela, setCreatedEscuela] =
    useState<CreateEscuelaResponse | null>(null);
  const createEscuela = useCreateEscuela();

  const form = useForm<CreateEscuelaFormValues>({
    resolver: zodResolver(createEscuelaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedEscuela(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateEscuelaFormValues) => {
    try {
      const result = await createEscuela.mutateAsync({
        data: buildCreateEscuelaPayload(values),
      });

      setCreatedEscuela(result);
      toast.success("Escuela creada", {
        description: `La escuela ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la escuela", {
        description: getEscuelaErrorMessage(error, "Error al crear escuela"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva escuela</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva escuela para el catalogo administrativo.
            </DialogDescription>
            <EscuelaDialogHeader
              title="Nueva escuela"
              subtitle="Configura nombre y siglas"
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
                            <FormLabel>Nombre de la escuela</FormLabel>
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
                            <FormLabel>Siglas</FormLabel>
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

              {createdEscuela ? (
                <CatalogCreateResultCard
                  title="Escuela creada"
                  description="La escuela ya esta disponible en el catalogo."
                  badgeLabel="Activa"
                  fields={[
                    { label: "Nombre", value: createdEscuela.name },
                    { label: "Siglas", value: createdEscuela.code },
                    { label: "ID", value: createdEscuela.id },
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
                disabled={createEscuela.isPending}
              >
                Crear escuela
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
