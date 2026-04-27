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
import { AreaClinicaDialogHeader } from "@features/admin/modules/catalogos/areas-clinicas/components/AreaClinicaDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createAreaClinicaSchema,
  type CreateAreaClinicaFormValues,
} from "@features/admin/modules/catalogos/areas-clinicas/domain/areas-clinicas.schemas";
import { useCreateAreaClinica } from "@features/admin/modules/catalogos/areas-clinicas/mutations/useCreateAreaClinica";
import { getAreaClinicaErrorMessage } from "@features/admin/modules/catalogos/areas-clinicas/utils/areas-clinicas.feedback";
import type { CreateAreaClinicaResponse } from "@api/types";

interface AreaClinicaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateAreaClinicaFormValues = {
  name: "",
};

const FORM_ID = "area-clinica-create-form";

export function AreaClinicaCreateDialog({
  open,
  onOpenChange,
}: AreaClinicaCreateDialogProps) {
  const [createdArea, setCreatedArea] =
    useState<CreateAreaClinicaResponse | null>(null);

  const createArea = useCreateAreaClinica();

  const form = useForm<CreateAreaClinicaFormValues>({
    resolver: zodResolver(createAreaClinicaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedArea(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateAreaClinicaFormValues) => {
    try {
      const result = await createArea.mutateAsync({
        data: { name: values.name },
      });

      setCreatedArea(result);
      toast.success("Área clínica creada", {
        description: `El área "${result.name}" se creó correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el área clínica", {
        description: getAreaClinicaErrorMessage(error, "Error al crear área clínica"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva área clínica</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva área clínica para el catálogo.
            </DialogDescription>
            <AreaClinicaDialogHeader
              title="Nueva área clínica"
              subtitle="Configura el nombre del área"
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
                          <FormLabel>Nombre del área clínica</FormLabel>
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

              {createdArea ? (
                <CatalogCreateResultCard
                  title="Área clínica creada"
                  description="El área ya está disponible en el catálogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdArea.name },
                    { label: "ID", value: createdArea.id },
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
                disabled={createArea.isPending}
              >
                Crear área clínica
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
