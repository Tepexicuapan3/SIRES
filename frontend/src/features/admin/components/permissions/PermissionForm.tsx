/**
 * PermissionForm - Formulario para crear/editar permisos
 *
 * Crear:
 * - code: "resource:action" (requerido, único)
 * - description: texto (requerido)
 * - category: RBAC | EXPEDIENTES | CONSULTAS | OTROS
 *
 * Editar:
 * - Solo description y category (code es inmutable)
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCreatePermission,
  useUpdatePermission,
} from "../../hooks/useAdminPermissions";
import type { PermissionResponse } from "@/api/types/permissions.types";
import { toast } from "sonner";

// Categorías disponibles
const CATEGORIES = [
  "RBAC",
  "EXPEDIENTES",
  "CONSULTAS",
  "USUARIOS",
  "REPORTES",
  "CONFIGURACION",
  "OTROS",
] as const;

// Schema para crear permiso
const createPermissionSchema = z.object({
  code: z
    .string()
    .min(1, "El código es requerido")
    .regex(
      /^[a-z_]+:[a-z_]+$/,
      "Formato: recurso:accion (ej: expedientes:read)",
    ),
  description: z
    .string()
    .min(1, "La descripción es requerida")
    .max(255, "Máximo 255 caracteres"),
  category: z.enum(CATEGORIES).optional(),
});

// Schema para editar permiso (sin code)
const updatePermissionSchema = z.object({
  description: z
    .string()
    .min(1, "La descripción es requerida")
    .max(255, "Máximo 255 caracteres"),
  category: z.enum(CATEGORIES).optional(),
});

type CreatePermissionValues = z.infer<typeof createPermissionSchema>;
type UpdatePermissionValues = z.infer<typeof updatePermissionSchema>;

interface PermissionFormProps {
  permission?: PermissionResponse;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PermissionForm = ({
  permission,
  onSuccess,
  onCancel,
}: PermissionFormProps) => {
  const isEditing = !!permission;
  const createPermissionMutation = useCreatePermission();
  const updatePermissionMutation = useUpdatePermission(
    permission?.id_permission || 0,
  );

  const form = useForm<CreatePermissionValues | UpdatePermissionValues>({
    resolver: zodResolver(
      isEditing ? updatePermissionSchema : createPermissionSchema,
    ),
    defaultValues: isEditing
      ? {
          description: permission.description,
          category: permission.category as (typeof CATEGORIES)[number],
        }
      : {
          code: "",
          description: "",
          category: "OTROS",
        },
  });

  const onSubmit = async (
    data: CreatePermissionValues | UpdatePermissionValues,
  ) => {
    try {
      if (isEditing) {
        await updatePermissionMutation.mutateAsync(
          data as UpdatePermissionValues,
        );
        toast.success("Permiso actualizado correctamente");
      } else {
        const createData = data as CreatePermissionValues;
        const [resource, action] = createData.code.split(":");
        await createPermissionMutation.mutateAsync({
          code: createData.code,
          resource,
          action,
          description: createData.description,
          category: createData.category,
        });
        toast.success("Permiso creado correctamente");
      }
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al guardar el permiso";
      toast.error(message);
    }
  };

  const isPending =
    createPermissionMutation.isPending || updatePermissionMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Editar Permiso" : "Crear Nuevo Permiso"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Solo puedes modificar la descripción y categoría. El código es inmutable."
            : "Define un nuevo permiso para el sistema RBAC."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Código (solo en crear) */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código del Permiso *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ej: expedientes:read"
                        {...field}
                        className="font-mono lowercase"
                      />
                    </FormControl>
                    <FormDescription>
                      Formato: <code>recurso:accion</code> (solo minúsculas y
                      guión bajo)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Mostrar código en modo edición (solo lectura) */}
            {isEditing && (
              <div>
                <label className="text-sm font-medium text-txt-body">
                  Código del Permiso
                </label>
                <div className="mt-2 rounded-lg border border-line-struct bg-subtle p-3">
                  <code className="text-sm font-medium text-brand">
                    {permission.code}
                  </code>
                  <p className="mt-1 text-xs text-txt-muted">
                    El código no se puede modificar
                  </p>
                </div>
              </div>
            )}

            {/* Descripción */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ej: Permite leer expedientes de pacientes"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Descripción clara de qué permite hacer este permiso
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoría */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Agrupa permisos por funcionalidad
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    ? "Actualizar Permiso"
                    : "Crear Permiso"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
