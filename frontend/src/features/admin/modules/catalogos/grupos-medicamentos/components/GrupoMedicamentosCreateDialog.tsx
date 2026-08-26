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
import { GrupoMedicamentosDialogHeader } from "@features/admin/modules/catalogos/grupos-medicamentos/components/GrupoMedicamentosDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createGrupoMedicamentosSchema,
  type CreateGrupoMedicamentosFormValues,
} from "@features/admin/modules/catalogos/grupos-medicamentos/domain/grupos-medicamentos.schemas";
import { useCreateGrupoMedicamentos } from "@features/admin/modules/catalogos/grupos-medicamentos/mutations/useCreateGrupoMedicamentos";
import { getGrupoMedicamentosErrorMessage } from "@features/admin/modules/catalogos/grupos-medicamentos/utils/grupos-medicamentos.feedback";
import type { CreateGrupoMedicamentosResponse } from "@api/types";

interface GrupoMedicamentosCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateGrupoMedicamentosFormValues = {
  name: "",
};

const FORM_ID = "grupo-medicamentos-create-form";

export function GrupoMedicamentosCreateDialog({
  open,
  onOpenChange,
}: GrupoMedicamentosCreateDialogProps) {
  const [created, setCreated] = useState<CreateGrupoMedicamentosResponse | null>(null);

  const createGrupoMedicamentos = useCreateGrupoMedicamentos();

  const form = useForm<CreateGrupoMedicamentosFormValues>({
    resolver: zodResolver(createGrupoMedicamentosSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateGrupoMedicamentosFormValues) => {
    try {
      const result = await createGrupoMedicamentos.mutateAsync({
        data: { name: values.name },
      });

      setCreated(result);
      toast.success("Grupo de medicamentos creado", {
        description: `El grupo ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el grupo de medicamentos", {
        description: getGrupoMedicamentosErrorMessage(error, "Error al crear grupo de medicamentos"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo grupo de medicamentos</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo grupo de medicamentos para el catalogo administrativo.
            </DialogDescription>
            <GrupoMedicamentosDialogHeader
              title="Nuevo grupo de medicamentos"
              subtitle="Configura el nombre del grupo de medicamentos"
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
                          <FormLabel>Nombre del grupo de medicamentos</FormLabel>
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
                  title="Grupo de medicamentos creado"
                  description="El grupo de medicamentos ya esta disponible en el catalogo."
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
                disabled={createGrupoMedicamentos.isPending}
              >
                Crear grupo
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
