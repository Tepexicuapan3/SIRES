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
import { ConsultorioDialogHeader } from "@features/admin/modules/catalogos/consultorios/components/ConsultorioDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createConsultorioSchema,
  type CreateConsultorioFormValues,
} from "@features/admin/modules/catalogos/consultorios/domain/consultorios.schemas";
import { useCreateConsultorio } from "@features/admin/modules/catalogos/consultorios/mutations/useCreateConsultorio";
import { getConsultorioErrorMessage } from "@features/admin/modules/catalogos/consultorios/utils/consultorios.feedback";
import type { CreateConsultorioResponse } from "@api/types";

interface ConsultorioCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateConsultorioFormValues = {
  name: "",
  code: "",
  idTurn: "",
  idCenter: "",
};

const FORM_ID = "consultorio-create-form";

export function ConsultorioCreateDialog({
  open,
  onOpenChange,
}: ConsultorioCreateDialogProps) {
  const [createdConsultorio, setCreatedConsultorio] =
    useState<CreateConsultorioResponse | null>(null);
  const createConsultorio = useCreateConsultorio();

  const form = useForm<CreateConsultorioFormValues>({
    resolver: zodResolver(createConsultorioSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedConsultorio(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateConsultorioFormValues) => {
    try {
      const result = await createConsultorio.mutateAsync({
        data: {
          name: values.name,
          code: Number(values.code),
          idTurn: Number(values.idTurn),
          idCenter: Number(values.idCenter),
          isActive: true,
        },
      });

      setCreatedConsultorio(result);
      toast.success("Consultorio creado", {
        description: `El consultorio ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el consultorio", {
        description: getConsultorioErrorMessage(
          error,
          "Error al crear consultorio",
        ),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo consultorio</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo consultorio para el catalogo administrativo.
            </DialogDescription>
            <ConsultorioDialogHeader
              title="Nuevo consultorio"
              subtitle="Configura datos operativos"
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
                            <FormLabel>Nombre del consultorio</FormLabel>
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
                            <FormLabel>Codigo</FormLabel>
                            <FormControl>
                              <Input {...field} inputMode="numeric" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="idTurn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID turno</FormLabel>
                            <FormControl>
                              <Input {...field} inputMode="numeric" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="idCenter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID centro</FormLabel>
                            <FormControl>
                              <Input {...field} inputMode="numeric" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </div>

              {createdConsultorio ? (
                <CatalogCreateResultCard
                  title="Consultorio creado"
                  description="El consultorio ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdConsultorio.name },
                    { label: "ID", value: createdConsultorio.id },
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
                disabled={createConsultorio.isPending}
              >
                Crear consultorio
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
