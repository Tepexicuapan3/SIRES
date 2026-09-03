import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { ScrollArea } from "@shared/ui/ScrollArea";
import { ReligionDialogHeader } from "@features/admin/modules/catalogos/religiones/components/ReligionDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createReligionSchema,
  type CreateReligionFormValues,
} from "@features/admin/modules/catalogos/religiones/domain/religiones.schemas";
import { useCreateReligion } from "@features/admin/modules/catalogos/religiones/mutations/useCreateReligion";
import { buildCreateReligionPayload } from "@features/admin/modules/catalogos/religiones/utils/religiones.transform";
import { getReligionErrorMessage } from "@features/admin/modules/catalogos/religiones/utils/religiones.feedback";
import type { CreateReligionResponse } from "@api/types";

interface ReligionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateReligionFormValues = { name: "" };
const FORM_ID = "religion-create-form";

export function ReligionCreateDialog({ open, onOpenChange }: ReligionCreateDialogProps) {
  const [createdReligion, setCreatedReligion] = useState<CreateReligionResponse | null>(null);
  const createReligion = useCreateReligion();

  const form = useForm<CreateReligionFormValues>({
    resolver: zodResolver(createReligionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedReligion(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateReligionFormValues) => {
    try {
      const result = await createReligion.mutateAsync({ data: buildCreateReligionPayload(values) });
      setCreatedReligion(result);
      toast.success("Religion creada", { description: `La religion ${result.name} se creo correctamente.` });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la religion", {
        description: getReligionErrorMessage(error, "Error al crear religion"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva religion</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva religion para el catalogo administrativo.
            </DialogDescription>
            <ReligionDialogHeader
              title="Nueva religion"
              subtitle="Configura el nombre"
              status={<Badge variant="outline">Plantilla</Badge>}
            />
          </DialogHeader>

          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="space-y-6 pt-4">
              <div className="rounded-2xl border border-line-struct bg-paper p-4">
                <Form {...form}>
                  <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la religion</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              {createdReligion ? (
                <CatalogCreateResultCard
                  title="Religion creada"
                  description="La religion ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdReligion.name },
                    { label: "ID", value: createdReligion.id },
                  ]}
                />
              ) : null}
            </div>
          </ScrollArea>

          <DialogFooter className="flex flex-col gap-3 border-t border-line-struct px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-txt-muted">Completa los campos requeridos.</div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>Cancelar</Button>
              <Button type="submit" form={FORM_ID} disabled={createReligion.isPending}>Crear religion</Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
