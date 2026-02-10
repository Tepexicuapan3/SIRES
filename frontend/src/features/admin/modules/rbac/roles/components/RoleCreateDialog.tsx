import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRole } from "@features/admin/modules/rbac/roles/mutations/useCreateRole";
import {
  createRoleSchema,
  type CreateRoleFormValues,
} from "@features/admin/modules/rbac/roles/domain/roles.schemas";
import { getRoleErrorMessage } from "@features/admin/modules/rbac/roles/utils/roles.feedback";
import { RoleDialogHeader } from "@features/admin/modules/rbac/roles/components/RoleDialogHeader";
import type { CreateRoleResponse } from "@api/types";

interface RoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateRoleFormValues = {
  name: "",
  description: "",
  landingRoute: "",
};

const FORM_ID = "role-create-form";

export function RoleCreateDialog({
  open,
  onOpenChange,
}: RoleCreateDialogProps) {
  const [createdRole, setCreatedRole] = useState<CreateRoleResponse | null>(
    null,
  );
  const createRole = useCreateRole();

  const form = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedRole(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateRoleFormValues) => {
    try {
      const result = await createRole.mutateAsync({
        data: {
          name: values.name,
          description: values.description,
          landingRoute: values.landingRoute?.trim() || undefined,
        },
      });

      setCreatedRole(result);
      toast.success("Rol creado", {
        description: `El rol ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el rol", {
        description: getRoleErrorMessage(error, "Error al crear rol"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-[980px] xl:w-[1120px]">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo rol</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un rol para administrar permisos.
            </DialogDescription>
            <RoleDialogHeader
              title="Nuevo rol"
              subtitle="Configura los datos base y su landing route"
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
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del rol</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="landingRoute"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Landing route</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="/admin/roles"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripcion</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              {createdRole ? (
                <div className="rounded-2xl border border-line-struct bg-subtle/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-txt-body">
                        Rol creado
                      </p>
                      <p className="text-xs text-txt-muted">
                        El rol ya esta disponible en el catalogo.
                      </p>
                    </div>
                    <Badge variant="stable">Activo</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-line-struct/60 bg-paper px-3 py-2">
                      <p className="text-xs text-txt-muted">Nombre</p>
                      <p className="text-sm font-medium text-txt-body">
                        {createdRole.name}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line-struct/60 bg-paper px-3 py-2">
                      <p className="text-xs text-txt-muted">ID</p>
                      <p className="text-sm font-medium text-txt-body">
                        {createdRole.id}
                      </p>
                    </div>
                  </div>
                </div>
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
                disabled={createRole.isPending}
              >
                Crear rol
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
