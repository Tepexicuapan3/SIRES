/**
 * UserFormDialog - Modal reutilizable para crear/editar usuarios
 *
 * ARQUITECTURA:
 * - Modal único que funciona en 2 modos: CREATE | EDIT
 * - Validación con Zod + React Hook Form
 * - Integración con TanStack Query (useCreateUser, useUpdateUser)
 * - Muestra contraseña temporal SOLO al crear (UNA SOLA VEZ)
 *
 * MODOS:
 * 1. CREATE: Todos los campos vacíos + selector de rol inicial
 * 2. EDIT: Campos pre-cargados con datos del usuario (sin cambio de password)
 *
 * PROPS:
 * - open: boolean - Estado del modal
 * - onOpenChange: (open: boolean) => void - Callback para cerrar
 * - mode: "create" | "edit" - Modo del formulario
 * - user?: UserDetail - Datos del usuario (solo en modo EDIT)
 * - onSuccess?: () => void - Callback opcional al guardar exitosamente
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User as UserIcon,
  Mail,
  IdCard,
  Save,
  X,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useCreateUser, useUpdateUser } from "../../hooks/useAdminUsers";
import { useClinics } from "../../hooks/useClinics";
import { useRoles } from "../../hooks/useRoles";
import type { UserDetail } from "@api/types";

// ============================================================
// VALIDACIÓN CON ZOD
// ============================================================

/**
 * Schema para CREAR usuario (todos los campos requeridos)
 */
const createUserSchema = z.object({
  usuario: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
  expediente: z
    .string()
    .length(8, "Debe ser de 8 dígitos")
    .regex(/^\d+$/, "Solo números"),
  nombre: z.string().min(2, "Nombre requerido"),
  paterno: z.string().min(2, "Apellido paterno requerido"),
  materno: z.string().min(2, "Apellido materno requerido"),
  id_clin: z.string().nullable(), // Opcional - se convierte a number al enviar
  correo: z
    .string()
    .email("Email inválido")
    .endsWith(
      "@metro.cdmx.gob.mx",
      "Debe ser email corporativo @metro.cdmx.gob.mx",
    ),
  id_rol: z.string().min(1, "Seleccioná un rol"),
});

/**
 * Schema para EDITAR usuario (todos los campos opcionales)
 * Solo se envía lo que se modifica
 */
const editUserSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  paterno: z.string().min(2, "Apellido paterno requerido"),
  materno: z.string().min(2, "Apellido materno requerido"),
  correo: z
    .string()
    .email("Email inválido")
    .endsWith(
      "@metro.cdmx.gob.mx",
      "Debe ser email corporativo @metro.cdmx.gob.mx",
    ),
  id_clin: z.string().nullable(), // Opcional - se convierte a number al enviar
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

// ============================================================
// PROPS DEL COMPONENTE
// ============================================================

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  user?: UserDetail; // Requerido en modo EDIT
  onSuccess?: () => void;
}

// ============================================================
// COMPONENTE
// ============================================================

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  user,
  onSuccess,
}: UserFormDialogProps) {
  // ============================================================
  // ESTADO LOCAL
  // ============================================================

  /**
   * Contraseña temporal generada (solo en modo CREATE)
   * Se muestra UNA SOLA VEZ después de crear el usuario
   */
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // ============================================================
  // TANSTACK QUERY - Datos
  // ============================================================

  /**
   * Fetch roles para selector (solo en modo CREATE)
   * Usa hook centralizado que maneja cache correctamente
   */
  const rolesQuery = useRoles();
  const rolesData = rolesQuery.data
    ? { total: rolesQuery.data.length, roles: rolesQuery.data }
    : undefined;
  const isLoadingRoles = rolesQuery.isLoading;

  /**
   * Fetch clínicas para selector
   */
  const { data: clinicas = [], isLoading: isLoadingClinics } = useClinics();

  // ============================================================
  // MUTACIONES
  // ============================================================

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser(user?.id_usuario || 0);

  const isSubmitting =
    mode === "create"
      ? createUserMutation.isPending
      : updateUserMutation.isPending;

  // ============================================================
  // REACT HOOK FORM
  // ============================================================

  const form = useForm<CreateUserFormValues | EditUserFormValues>({
    resolver: zodResolver(
      mode === "create" ? createUserSchema : editUserSchema,
    ),
    defaultValues:
      mode === "create"
        ? {
            usuario: "",
            expediente: "",
            nombre: "",
            paterno: "",
            materno: "",
            id_clin: null,
            correo: "",
            id_rol: "",
          }
        : {
            nombre: user?.nombre || "",
            paterno: user?.paterno || "",
            materno: user?.materno || "",
            correo: user?.correo || "",
            id_clin: user?.id_clin?.toString() || null,
          },
  });

  /**
   * Resetear form cuando cambia el modo o el usuario
   */
  useEffect(() => {
    if (mode === "edit" && user) {
      form.reset({
        nombre: user.nombre,
        paterno: user.paterno,
        materno: user.materno,
        correo: user.correo,
        id_clin: user.id_clin?.toString() || null,
      });
    } else if (mode === "create") {
      form.reset({
        usuario: "",
        expediente: "",
        nombre: "",
        paterno: "",
        materno: "",
        id_clin: null,
        correo: "",
        id_rol: "",
      });
      setTempPassword(null);
    }
  }, [mode, user, form]);

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Submit del formulario
   */
  const onSubmit = async (data: CreateUserFormValues | EditUserFormValues) => {
    try {
      if (mode === "create") {
        const createData = data as CreateUserFormValues;
        const result = await createUserMutation.mutateAsync({
          usuario: createData.usuario,
          expediente: createData.expediente,
          nombre: createData.nombre,
          paterno: createData.paterno,
          materno: createData.materno,
          id_clin: createData.id_clin ? parseInt(createData.id_clin) : null,
          correo: createData.correo,
          id_rol: parseInt(createData.id_rol),
        });

        // Guardar contraseña temporal para mostrarla
        setTempPassword(result.user.temp_password);

        toast.success("Usuario creado correctamente", {
          description: `Usuario ${result.user.usuario} registrado exitosamente`,
          duration: 5000,
        });

        // NO cerrar modal automáticamente - usuario debe copiar la contraseña
        onSuccess?.();
      } else {
        // Modo EDIT
        const editData = data as EditUserFormValues;
        await updateUserMutation.mutateAsync({
          nombre: editData.nombre,
          paterno: editData.paterno,
          materno: editData.materno,
          correo: editData.correo,
          id_clin: editData.id_clin ? parseInt(editData.id_clin) : null,
        });

        toast.success("Usuario actualizado correctamente");

        // Cerrar modal y limpiar
        handleClose();
        onSuccess?.();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Error al guardar usuario";
      toast.error("Error", {
        description: errorMessage,
      });
    }
  };

  /**
   * Cerrar modal (con limpieza)
   */
  const handleClose = () => {
    form.reset();
    setTempPassword(null);
    onOpenChange(false);
  };

  /**
   * Copiar contraseña temporal al portapapeles
   */
  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast.success("Contraseña copiada al portapapeles");
    }
  };

  /**
   * Cerrar después de mostrar contraseña
   */
  const handleCloseAfterCreate = () => {
    handleClose();
    toast.info("Modal cerrado. El usuario fue creado exitosamente.");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Crear Nuevo Usuario" : "Editar Usuario"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completá los datos del nuevo usuario. El sistema generará una contraseña temporal."
              : "Modificá los datos del usuario. No se puede cambiar el username ni la contraseña desde aquí."}
          </DialogDescription>
        </DialogHeader>

        {/* ========== CONTRASEÑA TEMPORAL (solo en CREATE después de éxito) ========== */}
        {mode === "create" && tempPassword && (
          <Alert className="border-status-stable bg-status-stable/10">
            <CheckCircle2 className="h-5 w-5 text-status-stable" />
            <AlertDescription className="space-y-3">
              <p className="font-semibold text-status-stable">
                ✅ Usuario creado exitosamente
              </p>
              <div className="p-3 bg-white border border-line-struct rounded-lg">
                <p className="text-xs text-txt-muted mb-2">
                  Contraseña temporal (copiar y entregar al usuario):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-lg font-bold text-brand bg-subtle p-2 rounded">
                    {tempPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPassword}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar
                  </Button>
                </div>
              </div>
              <p className="text-xs text-txt-muted">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                Esta contraseña se muestra <strong>UNA SOLA VEZ</strong>. El
                usuario deberá cambiarla en su primer acceso.
              </p>
              <Button
                variant="outline"
                onClick={handleCloseAfterCreate}
                className="w-full"
              >
                Cerrar y Volver
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ========== FORMULARIO ========== */}
        {(!tempPassword || mode === "edit") && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Usuario y Expediente (solo en CREATE, username no se puede editar) */}
              {mode === "create" && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Usuario */}
                  <FormField
                    control={form.control}
                    name="usuario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <UserIcon className="inline h-4 w-4 mr-1" />
                          Usuario
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ej: jperez"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Username único (sin espacios)
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
                        <FormLabel>
                          <IdCard className="inline h-4 w-4 mr-1" />
                          No. Expediente
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="8 dígitos"
                            maxLength={8}
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* En modo EDIT, mostrar expediente solo (no editable username) */}
              {mode === "edit" && (
                <FormField
                  control={form.control}
                  name="expediente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <IdCard className="inline h-4 w-4 mr-1" />
                        No. Expediente
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="8 dígitos"
                          maxLength={8}
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Nombres */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre(s)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ej: Juan Carlos"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paterno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido Paterno</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ej: García"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="materno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido Materno</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ej: López"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Clínica y Correo */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="id_clin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Building2 className="inline h-4 w-4 mr-1" />
                        Clínica Asignada
                      </FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "null" ? null : value)
                        }
                        value={field.value || "null"}
                        disabled={isSubmitting || isLoadingClinics}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingClinics
                                  ? "Cargando clínicas..."
                                  : "Seleccioná una clínica"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">
                            Sin clínica asignada
                          </SelectItem>
                          {clinicas.map((clinica) => (
                            <SelectItem
                              key={clinica.id_clin}
                              value={clinica.id_clin.toString()}
                            >
                              {clinica.clinica} ({clinica.folio_clin})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Opcional - podés asignar al usuario a una clínica
                        específica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="correo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Mail className="inline h-4 w-4 mr-1" />
                        Correo Electrónico
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="usuario@metro.cdmx.gob.mx"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Rol (solo en CREATE) */}
              {mode === "create" && (
                <FormField
                  control={form.control}
                  name="id_rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol Inicial</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting || isLoadingRoles}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingRoles
                                  ? "Cargando roles..."
                                  : "Seleccioná un rol"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rolesData?.roles.map((role) => (
                            <SelectItem
                              key={role.id_rol}
                              value={role.id_rol.toString()}
                            >
                              <div className="flex items-center gap-2">
                                <span>{role.desc_rol}</span>
                                {role.is_admin === 1 && (
                                  <Badge variant="critical" className="text-xs">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Este será el rol primario del usuario. Podés asignar más
                        roles después.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Acciones */}
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting
                    ? "Guardando..."
                    : mode === "create"
                      ? "Crear Usuario"
                      : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
