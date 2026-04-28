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
import { ScrollArea } from "@shared/ui/ScrollArea";
import { CentroAreaClinicaDialogHeader } from "@features/admin/modules/catalogos/centro-area-clinica/components/CentroAreaClinicaDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import { CatalogFkCombobox } from "@features/admin/modules/catalogos/shared/components/CatalogFkCombobox";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useAreasClinicasList } from "@features/admin/modules/catalogos/areas-clinicas/queries/useAreasClinicasList";
import {
  createCentroAreaClinicaSchema,
  type CreateCentroAreaClinicaFormValues,
} from "@features/admin/modules/catalogos/centro-area-clinica/domain/centro-area-clinica.schemas";
import { useCreateCentroAreaClinica } from "@features/admin/modules/catalogos/centro-area-clinica/mutations/useCreateCentroAreaClinica";
import { getCentroAreaClinicaErrorMessage } from "@features/admin/modules/catalogos/centro-area-clinica/utils/centro-area-clinica.feedback";
import type { CreateCentroAreaClinicaResponse } from "@api/types";

interface CentroAreaClinicaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateCentroAreaClinicaFormValues = {
  centerId: 0,
  areaClinicaId: 0,
};

const FORM_ID = "centro-area-clinica-create-form";

export function CentroAreaClinicaCreateDialog({
  open,
  onOpenChange,
}: CentroAreaClinicaCreateDialogProps) {
  const [createdItem, setCreatedItem] = useState<CreateCentroAreaClinicaResponse | null>(null);
  const createItem = useCreateCentroAreaClinica();

  const { data: centrosData } = useCentrosAtencionList({ isActive: true }, { enabled: open });
  const centrosOptions = (centrosData?.items ?? []).map((c) => ({ id: c.id, name: c.name }));

  const { data: areasData } = useAreasClinicasList(
    { isActive: true, pageSize: 100 },
    { enabled: open },
  );
  const areasOptions = (areasData?.items ?? []).map((a) => ({ id: a.id, name: a.name }));

  const form = useForm<CreateCentroAreaClinicaFormValues>({
    resolver: zodResolver(createCentroAreaClinicaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedItem(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateCentroAreaClinicaFormValues) => {
    try {
      const result = await createItem.mutateAsync({
        data: {
          centerId: values.centerId,
          areaClinicaId: values.areaClinicaId,
          isActive: true,
        },
      });

      setCreatedItem(result);
      toast.success("Área clínica asignada", {
        description: "La asignación se creó correctamente.",
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la asignación", {
        description: getCentroAreaClinicaErrorMessage(error, "Error al crear asignación"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Asignar área clínica a centro</DialogTitle>
            <DialogDescription className="sr-only">
              Asigna un área clínica a un centro de atención.
            </DialogDescription>
            <CentroAreaClinicaDialogHeader
              title="Asignar área clínica"
              subtitle="Selecciona centro y área"
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
                        name="areaClinicaId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Área clínica</FormLabel>
                            <FormControl>
                              <CatalogFkCombobox
                                options={areasOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Selecciona un área"
                                searchPlaceholder="Buscar área..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </div>

              {createdItem ? (
                <CatalogCreateResultCard
                  title="Asignación creada"
                  description="El área clínica ya está disponible en el centro de atención."
                  badgeLabel="Activa"
                  fields={[
                    { label: "Centro ID", value: createdItem.centerId },
                    { label: "Área ID", value: createdItem.areaClinicaId },
                  ]}
                />
              ) : null}
            </div>
          </ScrollArea>

          <DialogFooter className="flex flex-col gap-3 border-t border-line-struct px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-txt-muted">
              Selecciona el centro y el área clínica a asignar.
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
                disabled={createItem.isPending}
              >
                Asignar área
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
