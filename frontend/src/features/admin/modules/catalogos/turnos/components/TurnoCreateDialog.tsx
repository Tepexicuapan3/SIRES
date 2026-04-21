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
import { TurnoDialogHeader } from "@features/admin/modules/catalogos/turnos/components/TurnoDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createTurnoSchema,
  type CreateTurnoFormValues,
} from "@features/admin/modules/catalogos/turnos/domain/turnos.schemas";
import { useCreateTurno } from "@features/admin/modules/catalogos/turnos/mutations/useCreateTurno";
import { getTurnoErrorMessage } from "@features/admin/modules/catalogos/turnos/utils/turnos.feedback";
import type { CreateTurnoResponse } from "@api/types";

interface TurnoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateTurnoFormValues = {
  name: "",
};

const FORM_ID = "turno-create-form";

export function TurnoCreateDialog({
  open,
  onOpenChange,
}: TurnoCreateDialogProps) {
  const [createdTurno, setCreatedTurno] = useState<CreateTurnoResponse | null>(
    null,
  );

  const createTurno = useCreateTurno();

  const form = useForm<CreateTurnoFormValues>({
    resolver: zodResolver(createTurnoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedTurno(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateTurnoFormValues) => {
    try {
      const result = await createTurno.mutateAsync({
        data: { name: values.name },
      });

      setCreatedTurno(result);
      toast.success("Turno creado", {
        description: `El turno ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el turno", {
        description: getTurnoErrorMessage(error, "Error al crear turno"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo turno</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo turno para el catalogo administrativo.
            </DialogDescription>
            <TurnoDialogHeader
              title="Nuevo turno"
              subtitle="Configura el nombre del turno"
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
                          <FormLabel>Nombre del turno</FormLabel>
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

              {createdTurno ? (
                <CatalogCreateResultCard
                  title="Turno creado"
                  description="El turno ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdTurno.name },
                    { label: "ID", value: createdTurno.id },
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
                disabled={createTurno.isPending}
              >
                Crear turno
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
