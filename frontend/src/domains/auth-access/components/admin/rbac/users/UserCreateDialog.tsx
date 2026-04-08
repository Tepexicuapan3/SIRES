import { useForm, type Resolver } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ScrollArea } from "@shared/ui/ScrollArea";
import type { CentroAtencionListItem, RoleListItem } from "@api/types";
import { useCreateUser } from "@/domains/auth-access/hooks/rbac/users/useCreateUser";
import { UserCreateSidePanel } from "@/domains/auth-access/components/admin/rbac/users/UserCreateSidePanel";
import {
  createUserSchema,
  type CreateUserFormValues,
} from "@/domains/auth-access/types/rbac/users.schemas";
import { getUserErrorMessage } from "@/domains/auth-access/adapters/rbac/users/users.feedback";
import { UserDialogHeader } from "@/domains/auth-access/components/admin/rbac/users/UserDialogHeader";

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
  const createUser = useCreateUser();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema) as Resolver<CreateUserFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
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

      toast.success("Usuario creado", {
        description: `El usuario ${result.username} se creo correctamente.`,
      });
      handleDialogOpenChange(false);
    } catch (error) {
      toast.error("No se pudo crear el usuario", {
        description: getUserErrorMessage(error, "Error al crear usuario"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-[70vh] max-h-[70vh] w-[96vw] max-w-none overflow-hidden rounded-3xl bg-paper p-0 sm:max-w-none lg:w-[980px] xl:w-[1060px]"
      >
        <div className="flex h-full min-h-0">
          <UserCreateSidePanel />

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
