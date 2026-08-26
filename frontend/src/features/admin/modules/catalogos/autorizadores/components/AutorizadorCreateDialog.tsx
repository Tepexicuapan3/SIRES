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
import { CatalogFkCombobox } from "@shared/ui/catalog-fk-combobox";
import { AutorizadorDialogHeader } from "@features/admin/modules/catalogos/autorizadores/components/AutorizadorDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useTiposAutorizacionList } from "@features/admin/modules/catalogos/tipos-autorizacion/queries/useTiposAutorizacionList";
import {
  createAutorizadorSchema,
  type CreateAutorizadorFormValues,
} from "@features/admin/modules/catalogos/autorizadores/domain/autorizadores.schemas";
import { buildCreateAutorizadorPayload } from "@features/admin/modules/catalogos/autorizadores/utils/autorizadores.transform";
import { useCreateAutorizador } from "@features/admin/modules/catalogos/autorizadores/mutations/useCreateAutorizador";
import { getAutorizadorErrorMessage } from "@features/admin/modules/catalogos/autorizadores/utils/autorizadores.feedback";
import type { CreateAutorizadorResponse } from "@api/types";

interface AutorizadorCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateAutorizadorFormValues = {
  name: "",
  position: "",
  centerId: 0,
  authorizationTypeId: 0,
  userId: 0,
  authorizerPassword: "",
  fileNumber: "",
  signatureImage: "",
};

const FORM_ID = "autorizador-create-form";

export function AutorizadorCreateDialog({
  open,
  onOpenChange,
}: AutorizadorCreateDialogProps) {
  const [created, setCreated] = useState<CreateAutorizadorResponse | null>(null);

  const createAutorizador = useCreateAutorizador();

  const { data: centrosData } = useCentrosAtencionList({ isActive: true }, { enabled: open });
  const centrosOptions = (centrosData?.items ?? []).map((c) => ({ id: c.id, name: c.name }));

  const { data: tiposData } = useTiposAutorizacionList({ isActive: true }, { enabled: open });
  const tiposOptions = (tiposData?.items ?? []).map((t) => ({ id: t.id, name: t.name }));

  const form = useForm<CreateAutorizadorFormValues>({
    resolver: zodResolver(createAutorizadorSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateAutorizadorFormValues) => {
    try {
      const result = await createAutorizador.mutateAsync({
        data: buildCreateAutorizadorPayload(values),
      });

      setCreated(result);
      toast.success("Autorizador creado", {
        description: `El autorizador ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el autorizador", {
        description: getAutorizadorErrorMessage(error, "Error al crear autorizador"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo autorizador</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo autorizador para el catalogo administrativo.
            </DialogDescription>
            <AutorizadorDialogHeader
              title="Nuevo autorizador"
              subtitle="Configura los datos del personal autorizado"
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
                            <FormLabel>Nombre del autorizador</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="centerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Centro de atención</FormLabel>
                            <FormControl>
                              <CatalogFkCombobox
                                options={centrosOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Selecciona un centro"
                                searchPlaceholder="Buscar centro..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="authorizationTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de autorización</FormLabel>
                            <FormControl>
                              <CatalogFkCombobox
                                options={tiposOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Selecciona un tipo"
                                searchPlaceholder="Buscar tipo..."
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
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID de usuario</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="numeric"
                                value={field.value === 0 ? "" : field.value}
                                onChange={(event) =>
                                  field.onChange(
                                    event.target.value === "" ? 0 : Number(event.target.value),
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
                        name="authorizerPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña del autorizador</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>No. de expediente</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="signatureImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Imagen de firma (ruta)</FormLabel>
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
                  title="Autorizador creado"
                  description="El autorizador ya esta disponible en el catalogo."
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
                disabled={createAutorizador.isPending}
              >
                Crear autorizador
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
