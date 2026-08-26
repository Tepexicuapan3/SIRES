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
import { ParentescoDialogHeader } from "@features/admin/modules/catalogos/parentescos/components/ParentescoDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createParentescoSchema,
  type CreateParentescoFormValues,
} from "@features/admin/modules/catalogos/parentescos/domain/parentesco.schemas";
import { buildCreateParentescoPayload } from "@features/admin/modules/catalogos/parentescos/utils/parentesco.transform";
import { useCreateParentesco } from "@features/admin/modules/catalogos/parentescos/mutations/useCreateParentesco";
import { getParentescoErrorMessage } from "@features/admin/modules/catalogos/parentescos/utils/parentesco.feedback";
import type { CreateParentescoResponse } from "@api/types";

interface ParentescoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateParentescoFormValues = {
  id: "",
  name: "",
};

const FORM_ID = "parentesco-create-form";

export function ParentescoCreateDialog({
  open,
  onOpenChange,
}: ParentescoCreateDialogProps) {
  const [created, setCreated] = useState<CreateParentescoResponse | null>(null);

  const createParentesco = useCreateParentesco();

  const form = useForm<CreateParentescoFormValues>({
    resolver: zodResolver(createParentescoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreated(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateParentescoFormValues) => {
    try {
      const result = await createParentesco.mutateAsync({
        data: buildCreateParentescoPayload(values),
      });

      setCreated(result);
      toast.success("Parentesco creado", {
        description: `El parentesco ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el parentesco", {
        description: getParentescoErrorMessage(error, "Error al crear parentesco"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo parentesco</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo parentesco para el catalogo administrativo.
            </DialogDescription>
            <ParentescoDialogHeader
              title="Nuevo parentesco"
              subtitle="Configura el codigo y el nombre del parentesco"
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
                        name="id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Codigo</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={2} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </div>

              {created ? (
                <CatalogCreateResultCard
                  title="Parentesco creado"
                  description="El parentesco ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Codigo", value: created.id },
                    { label: "Nombre", value: created.name },
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
                disabled={createParentesco.isPending}
              >
                Crear parentesco
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
