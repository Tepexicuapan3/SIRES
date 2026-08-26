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
import { Textarea } from "@shared/ui/textarea";
import { ScrollArea } from "@shared/ui/ScrollArea";
import { EstudioDialogHeader } from "@features/admin/modules/catalogos/estudios/components/EstudioDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createEstudioSchema,
  type CreateEstudioFormValues,
} from "@features/admin/modules/catalogos/estudios/domain/estudios.schemas";
import { useCreateEstudio } from "@features/admin/modules/catalogos/estudios/mutations/useCreateEstudio";
import { buildCreateEstudioPayload } from "@features/admin/modules/catalogos/estudios/utils/estudios.transform";
import { getEstudioErrorMessage } from "@features/admin/modules/catalogos/estudios/utils/estudios.feedback";
import type { CreateEstudioResponse } from "@api/types";

interface EstudioCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateEstudioFormValues = {
  name: "",
  studyType: "",
  precio: undefined,
  indication: "",
};

const FORM_ID = "estudio-create-form";

export function EstudioCreateDialog({
  open,
  onOpenChange,
}: EstudioCreateDialogProps) {
  const [createdEstudio, setCreatedEstudio] =
    useState<CreateEstudioResponse | null>(null);
  const createEstudio = useCreateEstudio();

  const form = useForm<CreateEstudioFormValues>({
    resolver: zodResolver(createEstudioSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedEstudio(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateEstudioFormValues) => {
    try {
      const result = await createEstudio.mutateAsync({
        data: buildCreateEstudioPayload(values),
      });

      setCreatedEstudio(result);
      toast.success("Estudio creado", {
        description: `El estudio ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el estudio", {
        description: getEstudioErrorMessage(error, "Error al crear estudio"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo estudio</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo estudio para el catalogo administrativo.
            </DialogDescription>
            <EstudioDialogHeader
              title="Nuevo estudio"
              subtitle="Configura nombre, tipo y precio"
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
                            <FormLabel>Nombre del estudio</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="studyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de estudio</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="precio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(event) =>
                                field.onChange(
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="indication"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Indicacion clinica</FormLabel>
                          <FormControl>
                            <Textarea rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              {createdEstudio ? (
                <CatalogCreateResultCard
                  title="Estudio creado"
                  description="El estudio ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdEstudio.name },
                    { label: "ID", value: createdEstudio.id },
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
                disabled={createEstudio.isPending}
              >
                Crear estudio
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
