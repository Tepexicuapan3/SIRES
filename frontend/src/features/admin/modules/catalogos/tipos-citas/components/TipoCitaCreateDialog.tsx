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
import { TipoCitaDialogHeader } from "@features/admin/modules/catalogos/tipos-citas/components/TipoCitaDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createTipoCitaSchema,
  type CreateTipoCitaFormValues,
} from "@features/admin/modules/catalogos/tipos-citas/domain/tipos-citas.schemas";
import { useCreateTipoCita } from "@features/admin/modules/catalogos/tipos-citas/mutations/useCreateTipoCita";
import { buildCreateTipoCitaPayload } from "@features/admin/modules/catalogos/tipos-citas/utils/tipos-citas.transform";
import { getTipoCitaErrorMessage } from "@features/admin/modules/catalogos/tipos-citas/utils/tipos-citas.feedback";
import type { CreateTipoCitaResponse } from "@api/types";

interface TipoCitaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateTipoCitaFormValues = {
  name: "",
};

const FORM_ID = "tipo-cita-create-form";

export function TipoCitaCreateDialog({
  open,
  onOpenChange,
}: TipoCitaCreateDialogProps) {
  const [createdTipoCita, setCreatedTipoCita] =
    useState<CreateTipoCitaResponse | null>(null);
  const createTipoCita = useCreateTipoCita();

  const form = useForm<CreateTipoCitaFormValues>({
    resolver: zodResolver(createTipoCitaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedTipoCita(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateTipoCitaFormValues) => {
    try {
      const result = await createTipoCita.mutateAsync({
        data: buildCreateTipoCitaPayload(values),
      });

      setCreatedTipoCita(result);
      toast.success("Tipo de cita creado", {
        description: `El tipo de cita ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el tipo de cita", {
        description: getTipoCitaErrorMessage(
          error,
          "Error al crear tipo de cita",
        ),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo tipo de cita</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo tipo de cita para el catalogo administrativo.
            </DialogDescription>
            <TipoCitaDialogHeader
              title="Nuevo tipo de cita"
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
                          <FormLabel>Nombre del tipo de cita</FormLabel>
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

              {createdTipoCita ? (
                <CatalogCreateResultCard
                  title="Tipo de cita creado"
                  description="El tipo de cita ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdTipoCita.name },
                    { label: "ID", value: createdTipoCita.id },
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
                disabled={createTipoCita.isPending}
              >
                Crear tipo de cita
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
