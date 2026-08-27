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
import { Switch } from "@shared/ui/switch";
import { Textarea } from "@shared/ui/textarea";
import { ScrollArea } from "@shared/ui/ScrollArea";
import { EstudioMedicoDialogHeader } from "@features/admin/modules/catalogos/estudios-medicos/components/EstudioMedicoDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createEstudioMedicoSchema,
  type CreateEstudioMedicoFormValues,
} from "@features/admin/modules/catalogos/estudios-medicos/domain/estudios-medicos.schemas";
import { useCreateEstudioMedico } from "@features/admin/modules/catalogos/estudios-medicos/mutations/useCreateEstudioMedico";
import { buildCreateEstudioMedicoPayload } from "@features/admin/modules/catalogos/estudios-medicos/utils/estudios-medicos.transform";
import { getEstudioMedicoErrorMessage } from "@features/admin/modules/catalogos/estudios-medicos/utils/estudios-medicos.feedback";
import type { CreateEstudioMedicoResponse } from "@api/types";

interface EstudioMedicoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateEstudioMedicoFormValues = {
  name: "",
  studyType: "",
  indication: "",
  precio: undefined,
  isGeneral: false,
  isAuthorized: false,
  groupType: undefined,
  providerId: undefined,
};

const FORM_ID = "estudio-medico-create-form";

export function EstudioMedicoCreateDialog({
  open,
  onOpenChange,
}: EstudioMedicoCreateDialogProps) {
  const [createdEstudioMedico, setCreatedEstudioMedico] =
    useState<CreateEstudioMedicoResponse | null>(null);
  const createEstudioMedico = useCreateEstudioMedico();

  const form = useForm<CreateEstudioMedicoFormValues>({
    resolver: zodResolver(createEstudioMedicoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedEstudioMedico(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateEstudioMedicoFormValues) => {
    try {
      const result = await createEstudioMedico.mutateAsync({
        data: buildCreateEstudioMedicoPayload(values),
      });

      setCreatedEstudioMedico(result);
      toast.success("Estudio medico creado", {
        description: `El estudio ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el estudio medico", {
        description: getEstudioMedicoErrorMessage(
          error,
          "Error al crear estudio medico",
        ),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo estudio medico</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo estudio medico para el catalogo administrativo.
            </DialogDescription>
            <EstudioMedicoDialogHeader
              title="Nuevo estudio medico"
              subtitle="Configura nombre, tipo e indicacion"
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

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="groupType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de grupo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
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
                        name="providerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proveedor</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
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
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="isGeneral"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-line-struct p-3">
                            <FormLabel className="mb-0">
                              Estudio general
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isAuthorized"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-line-struct p-3">
                            <FormLabel className="mb-0">
                              Requiere autorizacion
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </div>

              {createdEstudioMedico ? (
                <CatalogCreateResultCard
                  title="Estudio medico creado"
                  description="El estudio ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdEstudioMedico.name },
                    { label: "ID", value: createdEstudioMedico.id },
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
                disabled={createEstudioMedico.isPending}
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
