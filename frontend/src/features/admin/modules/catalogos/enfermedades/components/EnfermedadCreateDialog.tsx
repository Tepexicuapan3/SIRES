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
import { EnfermedadDialogHeader } from "@features/admin/modules/catalogos/enfermedades/components/EnfermedadDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createEnfermedadSchema,
  type CreateEnfermedadFormValues,
} from "@features/admin/modules/catalogos/enfermedades/domain/enfermedades.schemas";
import { useCreateEnfermedad } from "@features/admin/modules/catalogos/enfermedades/mutations/useCreateEnfermedad";
import { buildCreateEnfermedadPayload } from "@features/admin/modules/catalogos/enfermedades/utils/enfermedades.transform";
import { getEnfermedadErrorMessage } from "@features/admin/modules/catalogos/enfermedades/utils/enfermedades.feedback";

interface EnfermedadCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreatedEnfermedad {
  id: number;
  name: string;
  code: string;
  cieVersion: string;
}

const DEFAULT_VALUES: CreateEnfermedadFormValues = {
  name: "",
  code: "",
  cieVersion: "",
};

const FORM_ID = "enfermedad-create-form";

export function EnfermedadCreateDialog({
  open,
  onOpenChange,
}: EnfermedadCreateDialogProps) {
  const [created, setCreated] = useState<CreatedEnfermedad | null>(null);
  const createEnfermedad = useCreateEnfermedad();

  const form = useForm<CreateEnfermedadFormValues>({
    resolver: zodResolver(createEnfermedadSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateEnfermedadFormValues) => {
    try {
      const result = await createEnfermedad.mutateAsync({
        data: buildCreateEnfermedadPayload(values),
      });

      setCreated({
        id: result.id,
        name: result.name,
        code: values.code,
        cieVersion: values.cieVersion,
      });
      toast.success("Enfermedad creada", {
        description: `La enfermedad ${values.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la enfermedad", {
        description: getEnfermedadErrorMessage(error, "Error al crear enfermedad"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva enfermedad</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva enfermedad para el catalogo administrativo.
            </DialogDescription>
            <EnfermedadDialogHeader
              title="Nueva enfermedad"
              subtitle="Configura el nombre, codigo y version CIE"
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
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Nombre de la enfermedad</FormLabel>
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
                            <FormLabel>Codigo CIE</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cieVersion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Version CIE</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej. 10, 11" />
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
                  title="Enfermedad creada"
                  description="La enfermedad ya esta disponible en el catalogo."
                  badgeLabel="Activa"
                  fields={[
                    { label: "Nombre", value: created.name },
                    { label: "Codigo", value: created.code },
                    { label: "Version CIE", value: created.cieVersion },
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
                disabled={createEnfermedad.isPending}
              >
                Crear enfermedad
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
