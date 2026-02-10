import { useState } from "react";
import { Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/ScrollArea";
import type {
  CentroAtencionListItem,
  CreateUserResponse,
  RoleListItem,
} from "@api/types";
import { useCreateUser } from "@features/admin/modules/rbac/users/mutations/useCreateUser";
import {
  createUserSchema,
  type CreateUserFormValues,
} from "@features/admin/modules/rbac/users/domain/users.schemas";
import { getUserErrorMessage } from "@features/admin/modules/rbac/users/utils/users.feedback";
import { UserDialogHeader } from "@features/admin/modules/rbac/users/components/UserDialogHeader";

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleOptions: RoleListItem[];
  clinicOptions: CentroAtencionListItem[];
}

const DEFAULT_VALUES: CreateUserFormValues = {
  username: "",
  firstName: "",
  paternalName: "",
  maternalName: "",
  email: "",
  clinicId: null,
  primaryRoleId: 0,
};

const FORM_ID = "user-create-form";

export function UserCreateDialog({
  open,
  onOpenChange,
  roleOptions,
  clinicOptions,
}: UserCreateDialogProps) {
  const [createdCredentials, setCreatedCredentials] =
    useState<CreateUserResponse | null>(null);
  const createUser = useCreateUser();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedCredentials(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      const result = await createUser.mutateAsync({
        data: {
          username: values.username,
          firstName: values.firstName,
          paternalName: values.paternalName,
          maternalName: values.maternalName,
          email: values.email,
          clinicId: values.clinicId ?? null,
          primaryRoleId: values.primaryRoleId,
        },
      });

      setCreatedCredentials(result);
      toast.success("Usuario creado", {
        description: `Usuario ${result.username} creado. Clave temporal: ${result.temporaryPassword}`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el usuario", {
        description: getUserErrorMessage(error, "Error al crear usuario"),
      });
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdCredentials || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(
        `Usuario: ${createdCredentials.username}\nClave: ${createdCredentials.temporaryPassword}`,
      );
      toast.success("Credenciales copiadas");
    } catch {
      toast.error("No se pudieron copiar las credenciales");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-[1024px] xl:w-[1120px]">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo usuario</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un usuario con acceso a RBAC.
            </DialogDescription>
            <UserDialogHeader
              title="Nuevo usuario"
              subtitle="Completa los datos para generar acceso"
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
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <FormField
                        control={form.control}
                        name="firstName"
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
                      <FormField
                        control={form.control}
                        name="paternalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido paterno</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="maternalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido materno</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuario</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="clinicId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Centro de atencion</FormLabel>
                            <Select
                              value={
                                field.value ? field.value.toString() : "none"
                              }
                              onValueChange={(value) =>
                                field.onChange(
                                  value === "none" ? null : Number(value),
                                )
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un centro" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Sin centro</SelectItem>
                                {clinicOptions.map((clinic) => (
                                  <SelectItem
                                    key={clinic.id}
                                    value={clinic.id.toString()}
                                  >
                                    {clinic.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="primaryRoleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rol primario</FormLabel>
                            <Select
                              value={field.value ? field.value.toString() : ""}
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roleOptions.map((role) => (
                                  <SelectItem
                                    key={role.id}
                                    value={role.id.toString()}
                                  >
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </div>

              {createdCredentials ? (
                <div className="rounded-2xl border border-line-struct bg-subtle/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-txt-body">
                        Acceso generado
                      </p>
                      <p className="text-xs text-txt-muted">
                        Guarda la clave temporal. Solo se muestra una vez.
                      </p>
                    </div>
                    <Badge variant="stable">Temporal</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-line-struct/60 bg-paper px-3 py-2">
                      <p className="text-xs text-txt-muted">Usuario</p>
                      <p className="text-sm font-medium text-txt-body">
                        {createdCredentials.username}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line-struct/60 bg-paper px-3 py-2">
                      <p className="text-xs text-txt-muted">Clave temporal</p>
                      <p className="text-sm font-medium text-txt-body">
                        {createdCredentials.temporaryPassword}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCopyCredentials()}
                    >
                      <Copy className="size-4" />
                      Copiar credenciales
                    </Button>
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
                disabled={createUser.isPending}
              >
                Crear usuario
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
