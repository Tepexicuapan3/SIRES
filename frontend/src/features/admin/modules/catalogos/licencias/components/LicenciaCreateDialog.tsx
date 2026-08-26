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
import { LicenciaDialogHeader } from "@features/admin/modules/catalogos/licencias/components/LicenciaDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createLicenciaSchema,
  type CreateLicenciaFormValues,
} from "@features/admin/modules/catalogos/licencias/domain/licencias.schemas";
import { useCreateLicencia } from "@features/admin/modules/catalogos/licencias/mutations/useCreateLicencia";
import { getLicenciaErrorMessage } from "@features/admin/modules/catalogos/licencias/utils/licencias.feedback";
import type { CreateLicenciaResponse } from "@api/types";

interface LicenciaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateLicenciaFormValues = {
  name: "",
};

const FORM_ID = "licencia-create-form";

export function LicenciaCreateDialog({
  open,
  onOpenChange,
}: LicenciaCreateDialogProps) {
  const [created, setCreated] = useState<CreateLicenciaResponse | null>(null);

  const createLicencia = useCreateLicencia();

  const form = useForm<CreateLicenciaFormValues>({
    resolver: zodResolver(createLicenciaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateLicenciaFormValues) => {
    try {
      const result = await createLicencia.mutateAsync({
        data: { name: values.name },
      });

      setCreated(result);
      toast.success("Licencia creada", {
        description: `La licencia ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la licencia", {
        description: getLicenciaErrorMessage(error, "Error al crear licencia"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva licencia</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva licencia para el catalogo administrativo.
            </DialogDescription>
            <LicenciaDialogHeader
              title="Nueva licencia"
              subtitle="Configura el nombre de la licencia"
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
                          <FormLabel>Nombre de la licencia</FormLabel>
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
                  title="Licencia creada"
                  description="La licencia ya esta disponible en el catalogo."
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
                disabled={createLicencia.isPending}
              >
                Crear licencia
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
