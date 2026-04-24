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
import { AreaDialogHeader } from "@features/admin/modules/catalogos/areas/components/AreaDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import { CatalogFkCombobox } from "@features/admin/modules/catalogos/shared/components/CatalogFkCombobox";
import {
  createAreaSchema,
  type CreateAreaFormValues,
} from "@features/admin/modules/catalogos/areas/domain/areas.schemas";
import { useCreateArea } from "@features/admin/modules/catalogos/areas/mutations/useCreateArea";
import { getAreaErrorMessage } from "@features/admin/modules/catalogos/areas/utils/areas.feedback";
import { useTiposAreasList } from "@features/admin/modules/catalogos/tipos-areas/queries/useTiposAreasList";
import type { CreateAreaResponse } from "@api/types";

interface AreaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateAreaFormValues = {
  name: "",
  code: "",
  idTipoArea: 0,
};

const FORM_ID = "area-create-form";

export function AreaCreateDialog({
  open,
  onOpenChange,
}: AreaCreateDialogProps) {
  const [createdArea, setCreatedArea] = useState<CreateAreaResponse | null>(
    null,
  );
  const createArea = useCreateArea();
  const { data: tiposAreasData } = useTiposAreasList({ isActive: true }, { enabled: open });

  const form = useForm<CreateAreaFormValues>({
    resolver: zodResolver(createAreaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedArea(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateAreaFormValues) => {
    try {
      const result = await createArea.mutateAsync({
        data: {
          name: values.name,
          code: values.code,
          idTipoArea: values.idTipoArea,
        },
      });

      setCreatedArea(result);
      toast.success("Area creada", {
        description: `El area ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el area", {
        description: getAreaErrorMessage(error, "Error al crear area"),
      });
    }
  };

  const tiposAreas = tiposAreasData?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-5xl bg-paper p-0 sm:w-[92vw] lg:w-[1000px] xl:w-[1100px]">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva Área</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva área para el catalogo administrativo.
            </DialogDescription>
            <AreaDialogHeader
              title="Nueva Área"
              subtitle="Configura nombre y código"
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
                    className="space-y-4"
                  >
                    {/* Nombre — fila completa */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del área</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              className="w-full resize-none font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Código y Tipo — lado a lado */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código</FormLabel>
                            <FormControl>
                              <Input {...field} className="w-full" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="idTipoArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de área</FormLabel>
                            <FormControl>
                              <CatalogFkCombobox
                                options={tiposAreas}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Selecciona un tipo"
                                searchPlaceholder="Buscar tipo de área..."
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
              {createdArea ? (
                <CatalogCreateResultCard
                  title="Area creada"
                  description="El area ya esta disponible en el catalogo."
                  badgeLabel="Activa"
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
                Crear area
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
