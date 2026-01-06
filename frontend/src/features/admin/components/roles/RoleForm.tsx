/**
 * RoleForm - Formulario para crear/editar roles
 *
 * Validaciones:
 * - Nombre: requerido, máx 50 caracteres
 * - Descripción: opcional
 * - Landing route: opcional, default "/inicio"
 * - Prioridad: opcional, default 100
 * - Is admin: opcional, default false
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreateRole, useUpdateRole } from "@/features/admin/hooks";
import type { Role } from "@/api/types/roles.types";
import { toast } from "sonner";

// Schema de validación con Zod
const roleFormSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "Máximo 50 caracteres"),
  descripcion: z.string().optional(),
  landing_route: z.string().optional(),
  priority: z.coerce.number().int().min(1).max(999).optional(),
  is_admin: z.boolean().optional(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  role?: Role; // Si existe, estamos editando
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RoleForm = ({ role, onSuccess, onCancel }: RoleFormProps) => {
  const isEditing = !!role;
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole(role?.id_rol || 0);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      nombre: role?.nom_rol || "",
      descripcion: role?.landing_route || "", // TODO: Agregar campo descripcion a backend
      landing_route: role?.landing_route || "/inicio",
      priority: role?.priority || 100,
      is_admin: role?.is_admin === 1,
    },
  });

  const onSubmit = async (data: RoleFormValues) => {
    try {
      if (isEditing) {
        await updateRoleMutation.mutateAsync({
          nombre: data.nombre,
          descripcion: data.descripcion,
          landing_route: data.landing_route,
          priority: data.priority,
        });
        toast.success("Rol actualizado correctamente");
      } else {
        await createRoleMutation.mutateAsync({
          nombre: data.nombre,
          descripcion: data.descripcion,
          landing_route: data.landing_route,
          priority: data.priority,
          is_admin: data.is_admin,
        });
        toast.success("Rol creado correctamente");
      }

      onSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error.message || "Error al guardar el rol. Intenta de nuevo.";
      toast.error(errorMessage);
    }
  };

  const isPending =
    createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Rol" : "Crear Nuevo Rol"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Modifica los datos del rol. Los roles del sistema no se pueden editar."
            : "Completa los datos para crear un nuevo rol personalizado."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Rol *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ej: ENFERMERIA"
                      {...field}
                      className="uppercase"
                      maxLength={50}
                    />
                  </FormControl>
                  <FormDescription>
                    Nombre identificador del rol (máx. 50 caracteres)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ej: Personal de enfermería con acceso a expedientes y constancias"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Breve descripción de las funciones del rol
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Landing Route */}
            <FormField
              control={form.control}
              name="landing_route"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruta de Inicio</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="/inicio"
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Página a la que se redirige al usuario después de iniciar
                    sesión
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Prioridad */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>Mayor = más prioridad</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Admin */}
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="is_admin"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="is_admin"
                          />
                        </FormControl>
                        <FormLabel htmlFor="is_admin" className="!mt-0">
                          Rol Administrador
                        </FormLabel>
                      </div>
                      <FormDescription>Acceso total al sistema</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={isPending}
                className="bg-brand hover:bg-brand-hover"
              >
                {isPending
                  ? isEditing
                    ? "Actualizando..."
                    : "Creando..."
                  : isEditing
                    ? "Actualizar Rol"
                    : "Crear Rol"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
