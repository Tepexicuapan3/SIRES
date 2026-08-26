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
import { TipoSanguineoDialogHeader } from "@features/admin/modules/catalogos/tipos-sanguineo/components/TipoSanguineoDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createTipoSanguineoSchema,
  type CreateTipoSanguineoFormValues,
} from "@features/admin/modules/catalogos/tipos-sanguineo/domain/tipos-sanguineo.schemas";
import { useCreateTipoSanguineo } from "@features/admin/modules/catalogos/tipos-sanguineo/mutations/useCreateTipoSanguineo";
import { getTipoSanguineoErrorMessage } from "@features/admin/modules/catalogos/tipos-sanguineo/utils/tipos-sanguineo.feedback";
import type { CreateTipoSanguineoResponse } from "@api/types";

interface TipoSanguineoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateTipoSanguineoFormValues = {
  name: "",
};

const FORM_ID = "tipo-sanguineo-create-form";

export function TipoSanguineoCreateDialog({
  open,
  onOpenChange,
}: TipoSanguineoCreateDialogProps) {
  const [created, setCreated] = useState<CreateTipoSanguineoResponse | null>(null);

  const createTipoSanguineo = useCreateTipoSanguineo();

  const form = useForm<CreateTipoSanguineoFormValues>({
    resolver: zodResolver(createTipoSanguineoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateTipoSanguineoFormValues) => {
    try {
      const result = await createTipoSanguineo.mutateAsync({
        data: { name: values.name },
      });

      setCreated(result);
      toast.success("Tipo sanguineo creado", {
        description: `El tipo sanguineo ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el tipo sanguineo", {
        description: getTipoSanguineoErrorMessage(error, "Error al crear tipo sanguineo"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo tipo sanguineo</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo tipo sanguineo para el catalogo administrativo.
            </DialogDescription>
            <TipoSanguineoDialogHeader
              title="Nuevo tipo sanguineo"
              subtitle="Configura el nombre del tipo sanguineo"
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
                          <FormLabel>Nombre del tipo sanguineo</FormLabel>
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
                  title="Tipo sanguineo creado"
                  description="El tipo sanguineo ya esta disponible en el catalogo."
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
                disabled={createTipoSanguineo.isPending}
              >
                Crear tipo sanguineo
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
