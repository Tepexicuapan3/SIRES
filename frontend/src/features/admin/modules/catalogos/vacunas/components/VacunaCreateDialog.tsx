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
import { VacunaDialogHeader } from "@features/admin/modules/catalogos/vacunas/components/VacunaDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createVacunaSchema,
  type CreateVacunaFormValues,
} from "@features/admin/modules/catalogos/vacunas/domain/vacunas.schemas";
import { useCreateVacuna } from "@features/admin/modules/catalogos/vacunas/mutations/useCreateVacuna";
import { getVacunaErrorMessage } from "@features/admin/modules/catalogos/vacunas/utils/vacunas.feedback";
import type { CreateVacunaResponse } from "@api/types";

interface VacunaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateVacunaFormValues = {
  name: "",
};

const FORM_ID = "vacuna-create-form";

export function VacunaCreateDialog({
  open,
  onOpenChange,
}: VacunaCreateDialogProps) {
  const [createdVacuna, setCreatedVacuna] =
    useState<CreateVacunaResponse | null>(null);

  const createVacuna = useCreateVacuna();

  const form = useForm<CreateVacunaFormValues>({
    resolver: zodResolver(createVacunaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedVacuna(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateVacunaFormValues) => {
    try {
      const result = await createVacuna.mutateAsync({
        data: { name: values.name },
      });

      setCreatedVacuna(result);
      toast.success("Vacuna creada", {
        description: `La vacuna "${result.name}" se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la vacuna", {
        description: getVacunaErrorMessage(error, "Error al crear vacuna"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva vacuna</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva vacuna para el catalogo de biologicos.
            </DialogDescription>
            <VacunaDialogHeader
              title="Nueva vacuna"
              subtitle="Configura el nombre del biologico"
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
                          <FormLabel>Nombre del biologico</FormLabel>
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

              {createdVacuna ? (
                <CatalogCreateResultCard
                  title="Vacuna creada"
                  description="La vacuna ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdVacuna.name },
                    { label: "ID", value: createdVacuna.id },
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
                disabled={createVacuna.isPending}
              >
                Crear vacuna
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
