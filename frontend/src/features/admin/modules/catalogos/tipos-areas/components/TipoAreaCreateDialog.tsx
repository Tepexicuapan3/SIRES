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
import { TipoAreaDialogHeader } from "@features/admin/modules/catalogos/tipos-areas/components/TipoAreaDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createTipoAreaSchema,
  type CreateTipoAreaFormValues,
} from "@features/admin/modules/catalogos/tipos-areas/domain/tipos-areas.schemas";
import { useCreateTipoArea } from "@features/admin/modules/catalogos/tipos-areas/mutations/useCreateTipoArea";
import { buildCreateTipoAreaPayload } from "@features/admin/modules/catalogos/tipos-areas/utils/tipos-areas.transform";
import { getTipoAreaErrorMessage } from "@features/admin/modules/catalogos/tipos-areas/utils/tipos-areas.feedback";
import type { CreateTipoAreaResponse } from "@api/types";

interface TipoAreaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateTipoAreaFormValues = {
  name: "",
};

const FORM_ID = "tipo-area-create-form";

export function TipoAreaCreateDialog({
  open,
  onOpenChange,
}: TipoAreaCreateDialogProps) {
  const [createdTipoArea, setCreatedTipoArea] =
    useState<CreateTipoAreaResponse | null>(null);
  const createTipoArea = useCreateTipoArea();

  const form = useForm<CreateTipoAreaFormValues>({
    resolver: zodResolver(createTipoAreaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedTipoArea(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateTipoAreaFormValues) => {
    try {
      const result = await createTipoArea.mutateAsync({
        data: buildCreateTipoAreaPayload(values),
      });

      setCreatedTipoArea(result);
      toast.success("Tipo de area creado", {
        description: `El tipo de area ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el tipo de area", {
        description: getTipoAreaErrorMessage(
          error,
          "Error al crear tipo de area",
        ),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo tipo de area</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo tipo de area para el catalogo administrativo.
            </DialogDescription>
            <TipoAreaDialogHeader
              title="Nuevo tipo de area"
              subtitle="Configura el nombre"
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
                          <FormLabel>Nombre del tipo de area</FormLabel>
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

              {createdTipoArea ? (
                <CatalogCreateResultCard
                  title="Tipo de area creado"
                  description="El tipo de area ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdTipoArea.name },
                    { label: "ID", value: createdTipoArea.id },
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
                disabled={createTipoArea.isPending}
              >
                Crear tipo de area
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
