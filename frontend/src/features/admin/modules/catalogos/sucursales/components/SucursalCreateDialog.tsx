import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
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
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";
import {
  createSucursalSchema,
  type CreateSucursalFormValues,
} from "@features/admin/modules/catalogos/sucursales/domain/sucursales.schemas";
import { useCreateSucursal } from "@features/admin/modules/catalogos/sucursales/mutations/useCreateSucursal";
import type { CreateSucursalResponse } from "@api/types";

interface SucursalCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateSucursalFormValues = {
  name: "",
};

const FORM_ID = "sucursal-create-form";

const SUCURSAL_ERROR_MESSAGES: Record<string, string> = {
  BRANCH_EXISTS: "Ya existe una sucursal con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export function SucursalCreateDialog({
  open,
  onOpenChange,
}: SucursalCreateDialogProps) {
  const [createdSucursal, setCreatedSucursal] =
    useState<CreateSucursalResponse | null>(null);
  const createSucursal = useCreateSucursal();

  const form = useForm<CreateSucursalFormValues>({
    resolver: zodResolver(createSucursalSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedSucursal(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateSucursalFormValues) => {
    try {
      const result = await createSucursal.mutateAsync({
        data: { name: values.name.trim() },
      });

      setCreatedSucursal(result);
      toast.success("Sucursal creada", {
        description: `La sucursal ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear la sucursal", {
        description: getCatalogErrorMessage(
          error,
          "Error al crear sucursal",
          SUCURSAL_ERROR_MESSAGES,
        ),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nueva sucursal</DialogTitle>
            <DialogDescription className="sr-only">
              Crea una nueva sucursal para el catalogo administrativo.
            </DialogDescription>
            <CatalogDialogHeader
              title="Nueva sucursal"
              subtitle="Configura el nombre de la sucursal"
              status={<Badge variant="outline">Plantilla</Badge>}
              icon={<Building2 className="size-7" />}
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
                          <FormLabel>Nombre de la sucursal</FormLabel>
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

              {createdSucursal ? (
                <CatalogCreateResultCard
                  title="Sucursal creada"
                  description="La sucursal ya esta disponible en el catalogo."
                  badgeLabel="Activa"
                  fields={[
                    { label: "Nombre", value: createdSucursal.name },
                    { label: "ID", value: createdSucursal.id },
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
                disabled={createSucursal.isPending}
              >
                Crear sucursal
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
