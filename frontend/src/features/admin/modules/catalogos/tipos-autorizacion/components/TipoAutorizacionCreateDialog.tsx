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
import { TipoAutorizacionDialogHeader } from "@features/admin/modules/catalogos/tipos-autorizacion/components/TipoAutorizacionDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createTipoAutorizacionSchema,
  type CreateTipoAutorizacionFormValues,
} from "@features/admin/modules/catalogos/tipos-autorizacion/domain/tipos-autorizacion.schemas";
import { useCreateTipoAutorizacion } from "@features/admin/modules/catalogos/tipos-autorizacion/mutations/useCreateTipoAutorizacion";
import { buildCreateTipoAutorizacionPayload } from "@features/admin/modules/catalogos/tipos-autorizacion/utils/tipos-autorizacion.transform";
import { getTipoAutorizacionErrorMessage } from "@features/admin/modules/catalogos/tipos-autorizacion/utils/tipos-autorizacion.feedback";

interface TipoAutorizacionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreatedTipoAutorizacion {
  id: number;
  name: string;
  code: string;
}

const DEFAULT_VALUES: CreateTipoAutorizacionFormValues = {
  name: "",
  code: "",
};

const FORM_ID = "tipo-autorizacion-create-form";

export function TipoAutorizacionCreateDialog({
  open,
  onOpenChange,
}: TipoAutorizacionCreateDialogProps) {
  const [created, setCreated] = useState<CreatedTipoAutorizacion | null>(null);
  const createTipoAutorizacion = useCreateTipoAutorizacion();

  const form = useForm<CreateTipoAutorizacionFormValues>({
    resolver: zodResolver(createTipoAutorizacionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateTipoAutorizacionFormValues) => {
    try {
      const result = await createTipoAutorizacion.mutateAsync({
        data: buildCreateTipoAutorizacionPayload(values),
      });

      setCreated({ id: result.id, name: result.name, code: values.code });
      toast.success("Tipo de autorizacion creado", {
        description: `El tipo ${values.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el tipo de autorizacion", {
        description: getTipoAutorizacionErrorMessage(error, "Error al crear tipo de autorizacion"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo tipo de autorizacion</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo tipo de autorizacion para el catalogo administrativo.
            </DialogDescription>
            <TipoAutorizacionDialogHeader
              title="Nuevo tipo de autorizacion"
              subtitle="Configura nombre y codigo"
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
                            <FormLabel>Nombre</FormLabel>
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
                  title="Tipo de autorizacion creado"
                  description="El tipo de autorizacion ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: created.name },
                    { label: "Codigo", value: created.code },
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
                disabled={createTipoAutorizacion.isPending}
              >
                Crear tipo de autorizacion
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
