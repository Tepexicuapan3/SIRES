/**
 * ============================================
 * COMPONENTE: CreateUserDialog
 * ============================================
 *
 * Diálogo para crear un nuevo usuario en el sistema SIRES.
 *
 * **Responsabilidad:**
 * - Formulario de creación de usuario con validación Zod
 * - Mostrar contraseña temporal DESPUÉS de creación exitosa
 * - Permitir copiar contraseña (se muestra UNA SOLA VEZ)
 *
 * **Flujo:**
 * 1. Usuario completa formulario
 * 2. Al enviar, se crea el usuario (POST /api/v1/users)
 * 3. Backend retorna contraseña temporal
 * 4. Se muestra modal con contraseña (¡ÚNICA OPORTUNIDAD de verla!)
 * 5. Admin copia contraseña y la entrega al usuario
 *
 * **Validaciones:**
 * - Usuario: alfanumérico, único (verificado en backend)
 * - Expediente: numérico, único (verificado en backend)
 * - Email: formato válido, único (verificado en backend)
 * - Campos obligatorios: usuario, expediente, nombre, paterno, correo, rol
 * - Campos opcionales: materno, id_clin
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, Copy, Eye, EyeOff } from "lucide-react";
import { useCreateUser } from "../../hooks/useAdminUsers";
import { useRoles } from "../../hooks/useAdminRoles";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CreateUserRequest } from "@api/types/users.types";

// ============================================================
// ZOD SCHEMA - VALIDACIÓN DE FORMULARIO
// ============================================================

/**
 * Schema de validación para crear usuario
 *
 * REGLAS:
 * - usuario: 3-50 chars, alfanumérico + guion bajo
 * - expediente: 1-20 chars, numérico
 * - nombre/paterno: 2-100 chars, solo letras/espacios/acentos
 * - materno: opcional, si se provee mismas reglas que nombre
 * - correo: email válido
 * - id_clin: número o null (opcional)
 * - id_rol: número obligatorio
 */
const createUserSchema = z.object({
  usuario: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(50, "El usuario no puede exceder 50 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo se permiten letras, números y guion bajo"),
  expediente: z
    .string()
    .min(1, "El expediente es obligatorio")
    .max(20, "El expediente no puede exceder 20 caracteres")
    .regex(/^[0-9]+$/, "El expediente solo puede contener números"),
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
  id_rol: z.coerce.number({
    required_error: "Seleccioná un rol",
    invalid_type_error: "Seleccioná un rol válido",
  }),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

// ============================================================
// PROPS
// ============================================================

export interface CreateUserDialogProps {
  /** Si el diálogo está abierto */
  open: boolean;
  /** Callback cuando se cierra el diálogo */
  onClose: () => void;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

/**
 * Diálogo para crear usuario
 *
 * **Estados:**
 * 1. Formulario inicial
 * 2. Submitting (cargando)
 * 3. Éxito → Mostrar contraseña temporal
 * 4. Error → Mostrar mensaje de error
 *
 * @example
 * const [showCreate, setShowCreate] = useState(false);
 *
 * <Button onClick={() => setShowCreate(true)}>Crear Usuario</Button>
 * <CreateUserDialog open={showCreate} onClose={() => setShowCreate(false)} />
 */
export function CreateUserDialog({ open, onClose }: CreateUserDialogProps) {
  const { toast } = useToast();

  // ============================================================
  // STATE - CONTRASEÑA TEMPORAL
  // ============================================================

  /**
   * Contraseña temporal retornada por el backend
   * Se muestra DESPUÉS de crear el usuario exitosamente
   * null = todavía no se creó el usuario
   */
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  /**
   * Toggle mostrar/ocultar contraseña
   */
  const [showPassword, setShowPassword] = useState(false);

  // ============================================================
  // HOOKS - DATOS Y MUTACIONES
  // ============================================================

  /** Obtener lista de roles activos */
  const { data: rolesData, isLoading: rolesLoading } = useRoles();

  /** Obtener lista de clínicas activas */
  const { data: clinicasData, isLoading: clinicasLoading } = useClinicas();

  /** Mutación para crear usuario */
  const createUserMutation = useCreateUser();

  // ============================================================
  // FORM - REACT HOOK FORM + ZOD
  // ============================================================

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      usuario: "",
      expediente: "",
      nombre: "",
      paterno: "",
      materno: "",
      correo: "",
      id_clin: undefined,
      id_rol: undefined,
    },
  });

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Submit del formulario
   * Crea el usuario y muestra la contraseña temporal
   */
  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      // Preparar data para el backend
      const requestData: CreateUserRequest = {
        usuario: values.usuario.trim(),
        expediente: values.expediente.trim(),
        nombre: values.nombre.trim(),
        paterno: values.paterno.trim(),
        materno: values.materno?.trim() || "",
        correo: values.correo.trim(),
        id_clin: values.id_clin ?? null,
        id_rol: values.id_rol,
      };

      // Ejecutar mutación
      const response = await createUserMutation.mutateAsync(requestData);

      // Guardar contraseña temporal (¡ÚNICA VEZ que se retorna!)
      setTempPassword(response.user.temp_password);

      // Toast de éxito
      toast({
        title: "Usuario creado exitosamente",
        description: `El usuario ${response.user.usuario} fue creado. Copiá la contraseña temporal.`,
        variant: "default",
      });
    } catch (error: unknown) {
      // Error específico del backend (ej: usuario duplicado)
      let errorMessage = "Ocurrió un error al crear el usuario";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        errorMessage =
          axiosError.response?.data?.message ||
          "Ocurrió un error al crear el usuario";
      }

      // Toast de error
      toast({
        title: "Error al crear usuario",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  /**
   * Copiar contraseña al portapapeles
   */
  const handleCopyPassword = async () => {
    if (!tempPassword) return;

    try {
      await navigator.clipboard.writeText(tempPassword);
      toast({
        title: "Contraseña copiada",
        description: "La contraseña temporal fue copiada al portapapeles",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar la contraseña. Copiala manualmente.",
        variant: "destructive",
      });
    }
  };

  /**
   * Cerrar diálogo y resetear formulario
   */
  const handleClose = () => {
    form.reset();
    setTempPassword(null);
    setShowPassword(false);
    onClose();
  };

  // ============================================================
  // RENDER - MODAL CON CONTRASEÑA TEMPORAL (DESPUÉS DE CREAR)
  // ============================================================

  if (tempPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-status-stable/15">
                <CheckCircle
                  className="size-5 text-status-stable"
                  aria-hidden="true"
                />
              </div>
              <div>
                <DialogTitle>Usuario creado exitosamente</DialogTitle>
                <DialogDescription>
                  Guardá la contraseña temporal. No se podrá recuperar después.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Contraseña temporal */}
          <Alert className="border-status-alert bg-status-alert/10">
            <AlertTitle className="text-status-alert">
              ⚠️ Contraseña temporal
            </AlertTitle>
            <AlertDescription>
              Esta contraseña se muestra UNA SOLA VEZ. El usuario debe cambiarla
              al iniciar sesión.
            </AlertDescription>
          </Alert>

          {/* Input con contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-txt-body">
              Contraseña
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={tempPassword}
                  type={showPassword ? "text" : "password"}
                  className="font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xs p-1 text-txt-muted hover:bg-subtle hover:text-txt-body"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyPassword}
                aria-label="Copiar contraseña"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ============================================================
  // RENDER - FORMULARIO DE CREACIÓN
  // ============================================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Completá los datos del nuevo usuario. Se generará una contraseña
            temporal que deberá cambiar al primer inicio de sesión.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ============================================================
                SECCIÓN: CREDENCIALES
                ============================================================ */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-txt-body">
                Credenciales
              </h3>

              {/* Usuario */}
              <FormField
                control={form.control}
                name="usuario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="jperez"
                        {...field}
                        disabled={createUserMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre de usuario para iniciar sesión (solo letras,
                      números y _)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expediente */}
              <FormField
                control={form.control}
                name="expediente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expediente *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12345"
                        {...field}
                        disabled={createUserMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Número de expediente del empleado (solo números)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ============================================================
                SECCIÓN: DATOS PERSONALES
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
                        disabled={createUserMutation.isPending}
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
                        disabled={createUserMutation.isPending}
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
                        disabled={createUserMutation.isPending}
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
                        disabled={createUserMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ============================================================
                SECCIÓN: ASIGNACIÓN
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
                      disabled={createUserMutation.isPending || clinicasLoading}
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
                      Clínica donde trabajará el usuario (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rol */}
              <FormField
                control={form.control}
                name="id_rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                      disabled={createUserMutation.isPending || rolesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccioná un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rolesData?.roles
                          ?.filter((role) => role.est_rol === "A")
                          .map((role) => (
                            <SelectItem
                              key={role.id_rol}
                              value={role.id_rol.toString()}
                            >
                              {role.desc_rol}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Rol inicial del usuario (define permisos y accesos)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ============================================================
                FOOTER - BOTONES
                ============================================================ */}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Usuario"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
