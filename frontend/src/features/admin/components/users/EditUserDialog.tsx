/**
 * ============================================
 * COMPONENTE: EditUserDialog
 * ============================================
 *
 * Diálogo para editar datos básicos de un usuario existente.
 *
 * **Responsabilidad:**
 * - Formulario de edición con validación Zod
 * - Pre-poblar campos con datos actuales del usuario
 * - Actualizar solo campos modificados (partial update)
 *
 * **Campos Editables:**
 * - Nombre, paterno, materno
 * - Correo electrónico
 * - Clínica asignada
 *
 * **Campos NO Editables (requieren flujos específicos):**
 * - Usuario (login) - No se puede cambiar
 * - Expediente - No se puede cambiar
 * - Rol - Usar el módulo de gestión de roles
 * - Estado (activo/inactivo) - Usar botón activar/desactivar en la tabla
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useUser, useUpdateUser } from "../../hooks/useAdminUsers";
import { useClinicas } from "../../hooks/useAdminClinicas";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UpdateUserRequest } from "@api/types";

// ============================================================
// ZOD SCHEMA - VALIDACIÓN DE FORMULARIO
// ============================================================

/**
 * Schema de validación para editar usuario
 *
 * REGLAS:
 * - nombre/paterno: 2-100 chars, solo letras/espacios/acentos
 * - materno: opcional, si se provee mismas reglas que nombre
 * - correo: email válido
 * - id_clin: número o null (opcional)
 */
const editUserSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
      "Solo se permiten letras, espacios y acentos",
    ),
  paterno: z
    .string()
    .min(2, "El apellido paterno debe tener al menos 2 caracteres")
    .max(100, "El apellido paterno no puede exceder 100 caracteres")
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
      "Solo se permiten letras, espacios y acentos",
    ),
  materno: z
    .string()
    .max(100, "El apellido materno no puede exceder 100 caracteres")
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/,
      "Solo se permiten letras, espacios y acentos",
    )
    .optional()
    .or(z.literal("")),
  correo: z.string().email("Formato de correo electrónico inválido"),
  id_clin: z.coerce.number().nullable().optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

// ============================================================
// PROPS
// ============================================================

export interface EditUserDialogProps {
  /** Si el diálogo está abierto */
  open: boolean;
  /** ID del usuario a editar */
  userId: number;
  /** Callback cuando se cierra el diálogo */
  onClose: () => void;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

/**
 * Diálogo para editar usuario
 *
 * **Estados:**
 * 1. Loading → Cargando datos del usuario
 * 2. Loaded → Formulario con datos pre-poblados
 * 3. Submitting → Guardando cambios
 * 4. Error → Mostrar mensaje de error
 *
 * @example
 * const [editUserId, setEditUserId] = useState<number | null>(null);
 *
 * <Button onClick={() => setEditUserId(123)}>Editar Usuario</Button>
 * {editUserId && (
 *   <EditUserDialog
 *     open
 *     userId={editUserId}
 *     onClose={() => setEditUserId(null)}
 *   />
 * )}
 */
export function EditUserDialog({ open, userId, onClose }: EditUserDialogProps) {
  const { toast } = useToast();

  // ============================================================
  // HOOKS - DATOS Y MUTACIONES
  // ============================================================

  /** Obtener datos del usuario */
  const {
    data: userData,
    isLoading: userLoading,
    isError: userError,
  } = useUser(userId);

  /** Obtener lista de clínicas activas */
  const { data: clinicasData, isLoading: clinicasLoading } = useClinicas();

  /** Mutación para actualizar usuario */
  const updateUserMutation = useUpdateUser(userId);

  // ============================================================
  // FORM - REACT HOOK FORM + ZOD
  // ============================================================

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nombre: "",
      paterno: "",
      materno: "",
      correo: "",
      id_clin: undefined,
    },
  });

  // ============================================================
  // EFFECTS - PRE-POBLAR FORMULARIO CON DATOS DEL USUARIO
  // ============================================================

  useEffect(() => {
    if (userData?.user) {
      form.reset({
        nombre: userData.user.nombre,
        paterno: userData.user.paterno,
        materno: userData.user.materno || "",
        correo: userData.user.correo,
        id_clin: userData.user.id_clin ?? undefined,
      });
    }
  }, [userData, form]);

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Submit del formulario
   * Envía solo los campos modificados (partial update)
   */
  const onSubmit = async (values: EditUserFormValues) => {
    try {
      // Preparar data para el backend (partial update)
      const requestData: UpdateUserRequest = {
        nombre: values.nombre.trim(),
        paterno: values.paterno.trim(),
        materno: values.materno?.trim() || "",
        correo: values.correo.trim(),
        id_clin: values.id_clin ?? null,
      };

      // Ejecutar mutación
      await updateUserMutation.mutateAsync(requestData);

      // Toast de éxito
      toast({
        title: "Usuario actualizado",
        description: `Los datos de ${userData?.user.usuario} fueron actualizados exitosamente.`,
        variant: "default",
      });

      // Cerrar diálogo
      handleClose();
    } catch (error: unknown) {
      // Error específico del backend
      let errorMessage = "Ocurrió un error al actualizar el usuario";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        errorMessage =
          axiosError.response?.data?.message ||
          "Ocurrió un error al actualizar el usuario";
      }

      // Toast de error
      toast({
        title: "Error al actualizar usuario",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  /**
   * Cerrar diálogo y resetear formulario
   */
  const handleClose = () => {
    form.reset();
    onClose();
  };

  // ============================================================
  // RENDER - LOADING STATE
  // ============================================================

  if (userLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-8 animate-spin text-brand" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ============================================================
  // RENDER - ERROR STATE
  // ============================================================

  if (userError || !userData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              No se pudo cargar la información del usuario
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              Ocurrió un error al cargar los datos del usuario. Intentá de nuevo
              más tarde.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={handleClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ============================================================
  // RENDER - FORMULARIO DE EDICIÓN
  // ============================================================

  const user = userData.user;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modificá los datos de {user.usuario} ({user.expediente})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ============================================================
                SECCIÓN: CREDENCIALES (SOLO LECTURA)
                ============================================================ */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-txt-body">
                Credenciales (solo lectura)
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Usuario (read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-txt-muted">
                    Usuario
                  </label>
                  <Input readOnly value={user.usuario} disabled />
                  <p className="text-xs text-txt-hint">
                    El nombre de usuario no se puede modificar
                  </p>
                </div>

                {/* Expediente (read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-txt-muted">
                    Expediente
                  </label>
                  <Input
                    readOnly
                    value={user.expediente || "Sin expediente"}
                    disabled
                  />
                  <p className="text-xs text-txt-hint">
                    El expediente no se puede modificar
                  </p>
                </div>
              </div>
            </div>

            {/* ============================================================
                SECCIÓN: DATOS PERSONALES (EDITABLES)
                ============================================================ */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-txt-body">
                Datos Personales
              </h3>

              {/* Nombre */}
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre(s) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan"
                        {...field}
                        disabled={updateUserMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Apellido Paterno */}
              <FormField
                control={form.control}
                name="paterno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido Paterno *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Pérez"
                        {...field}
                        disabled={updateUserMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Apellido Materno */}
              <FormField
                control={form.control}
                name="materno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido Materno</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="García (opcional)"
                        {...field}
                        disabled={updateUserMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Correo */}
              <FormField
                control={form.control}
                name="correo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="juan.perez@metro.cdmx.gob.mx"
                        {...field}
                        disabled={updateUserMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ============================================================
                SECCIÓN: ASIGNACIÓN (EDITABLE)
                ============================================================ */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-txt-body">
                Asignación
              </h3>

              {/* Clínica */}
              <FormField
                control={form.control}
                name="id_clin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clínica</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "null" ? null : Number(value))
                      }
                      value={field.value?.toString() ?? "null"}
                      disabled={updateUserMutation.isPending || clinicasLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccioná una clínica (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">
                          Sin clínica asignada
                        </SelectItem>
                        {clinicasData?.map((clinica) => (
                          <SelectItem
                            key={clinica.id_clin}
                            value={clinica.id_clin.toString()}
                          >
                            {clinica.clinica} ({clinica.folio_clin})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Clínica donde trabaja el usuario (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nota sobre rol */}
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Nota:</strong> Para cambiar el rol del usuario, usá el
                  módulo de gestión de roles.
                </AlertDescription>
              </Alert>
            </div>

            {/* ============================================================
                FOOTER - BOTONES
                ============================================================ */}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
