import { useState } from "react";
import { CircleAlert, Copy, ShieldCheck, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
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
      <DialogContent
        showCloseButton={false}
        className="h-[70vh] max-h-[70vh] w-[96vw] max-w-none overflow-hidden rounded-3xl bg-paper p-0 sm:max-w-none lg:w-[980px] xl:w-[1060px]"
      >
        <div className="flex h-full min-h-0">
          <aside className="hidden w-[310px] shrink-0 border-r border-line-struct/70 bg-subtle/20 lg:flex">
            <div className="flex min-h-0 w-full flex-1 flex-col">
              <div className="flex flex-col items-center space-y-4 px-6 pt-6 pb-5 text-center">
                <Avatar className="size-20 rounded-2xl border border-line-struct/70 bg-subtle/40">
                  <AvatarFallback className="rounded-2xl text-sm font-semibold text-txt-muted">
                    NU
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-base leading-none font-semibold text-txt-body uppercase">
                    Nuevo usuario
                  </p>
                  <p className="text-sm text-txt-muted">
                    Completa los datos para generar acceso al sistema.
                  </p>
                </div>
                <Badge variant="outline">Plantilla</Badge>
              </div>

              <Separator />

              <ScrollArea className="min-h-0 flex-1 px-6 py-5">
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-2.5 rounded-xl border border-line-struct/60 bg-paper/60 px-3 py-3">
                    <UserRound className="mt-0.5 size-4 shrink-0 text-txt-muted" />
                    <div>
                      <p className="font-medium text-txt-body">Perfil base</p>
                      <p className="text-xs text-txt-muted">
                        Define nombre, usuario y correo institucional.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl border border-line-struct/60 bg-paper/60 px-3 py-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-txt-muted" />
                    <div>
                      <p className="font-medium text-txt-body">Accesos</p>
                      <p className="text-xs text-txt-muted">
                        Asigna centro y rol primario para permisos iniciales.
                      </p>
                    </div>
                  </div>

                  {createdCredentials ? (
                    <div className="rounded-xl border border-status-alert/40 bg-status-alert/10 px-3 py-3">
                      <div className="flex items-start gap-2.5">
                        <CircleAlert className="mt-0.5 size-4 shrink-0 text-status-alert" />
                        <div className="space-y-1">
                          <p className="font-medium text-txt-body">
                            Clave temporal generada
                          </p>
                          <p className="text-xs text-txt-muted">
                            Copia y comparte la clave. Solo se muestra una vez.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <DialogHeader className="px-5 pt-5 lg:px-8 lg:pt-5">
              <DialogTitle className="sr-only">Nuevo usuario</DialogTitle>
              <DialogDescription className="sr-only">
                Crea un usuario con acceso a RBAC.
              </DialogDescription>
              <div className="lg:hidden">
                <UserDialogHeader
                  title="Nuevo usuario"
                  subtitle="Completa los datos para generar acceso"
                  status={<Badge variant="outline">Plantilla</Badge>}
                />
              </div>
            </DialogHeader>

            <ScrollArea
              className="min-h-0 flex-1 px-5 pb-6 lg:px-8 lg:pb-8"
              viewportClassName="overflow-x-auto"
            >
              <div className="space-y-5 pt-0">
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

                      <div className="grid gap-4 sm:grid-cols-2">
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
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Selecciona un centro" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">
                                    Sin centro
                                  </SelectItem>
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

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="primaryRoleId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rol primario</FormLabel>
                              <Select
                                value={
                                  field.value ? field.value.toString() : ""
                                }
                                onValueChange={(value) =>
                                  field.onChange(Number(value))
                                }
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11">
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

            <DialogFooter className="flex flex-col gap-3 border-t border-line-struct px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
