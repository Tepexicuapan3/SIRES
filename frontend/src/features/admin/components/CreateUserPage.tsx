/**
 * Página de Creación de Usuarios
 * Formulario para registrar nuevos usuarios y asignar roles
 */

import { useState } from "react";
import {
  UserPlus,
  Save,
  X,
  Mail,
  User as UserIcon,
  IdCard,
  Building2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { Clinica } from "@api/types/users.types";
import { useClinics } from "../hooks/useClinics";
import { useRoles } from "../hooks/useRoles";

// Schema de validación
const createUserSchema = z.object({
  usuario: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres"),
  nombre: z.string().min(2, "Nombre requerido"),
  paterno: z.string().min(2, "Apellido paterno requerido"),
  materno: z.string().min(2, "Apellido materno requerido"),
  expediente: z
    .string()
    .length(8, "Debe ser de 8 dígitos")
    .regex(/^\d+$/, "Solo números"),
  id_clin: z.string().nullable(),
  correo: z.string().email("Email inválido"),
  rol: z.string().min(1, "Seleccioná un rol"),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export const CreateUserPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Fetch roles from API usando hook centralizado
  const rolesQuery = useRoles();
  const rolesData = rolesQuery.data
    ? { total: rolesQuery.data.length, roles: rolesQuery.data }
    : undefined;
  const isLoadingRoles = rolesQuery.isLoading;

  // Fetch clínicas
  const { data: clinicas = [], isLoading: isLoadingClinics } = useClinics();

  // Mutation para crear usuario
  const createUserMutation = useMutation({
    mutationFn: usersAPI.create,
    onSuccess: (data) => {
      toast.success("Usuario creado correctamente", {
        description: `Usuario ${data.user.usuario} registrado. Contraseña temporal generada.`,
        duration: 8000,
      });

      // Guardar password temporal para mostrar al admin
      setTempPassword(data.user.temp_password);

      // NO resetear el form inmediatamente para que el admin pueda copiar la password
      // reset() se llamará cuando haga click en "Crear Otro" o "Cancelar"
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Error al crear usuario";
      toast.error("Error", {
        description: errorMessage,
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      usuario: "",
      nombre: "",
      paterno: "",
      materno: "",
      expediente: "",
      id_clin: null,
      correo: "",
      rol: "",
    },
  });

  const selectedRole = watch("rol");

  const onSubmit = async (data: CreateUserForm) => {
    setIsSubmitting(true);
    setTempPassword(null); // Limpiar password anterior

    try {
      await createUserMutation.mutateAsync({
        usuario: data.usuario,
        expediente: data.expediente,
        nombre: data.nombre,
        paterno: data.paterno,
        materno: data.materno,
        id_clin: data.id_clin ? parseInt(data.id_clin) : null,
        correo: data.correo,
        id_rol: parseInt(data.rol),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setTempPassword(null);
    toast.info("Formulario limpiado");
  };

  const handleCreateAnother = () => {
    reset();
    setTempPassword(null);
    toast.info("Listo para crear otro usuario");
  };

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <UserPlus className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Crear Usuario
              </h1>
              <p className="text-txt-muted">
                Registrar nuevo usuario en el sistema
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Datos del Usuario</CardTitle>
              <CardDescription>
                Todos los campos son obligatorios. El usuario recibirá
                credenciales por email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Usuario y Expediente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usuario">
                    <UserIcon className="inline size-4 mr-1" />
                    Usuario
                  </Label>
                  <Input
                    id="usuario"
                    placeholder="ej: JUAN123"
                    {...register("usuario")}
                    className={errors.usuario ? "border-status-critical" : ""}
                  />
                  {errors.usuario && (
                    <p className="text-xs text-status-critical">
                      {errors.usuario.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expediente">
                    <IdCard className="inline size-4 mr-1" />
                    No. Expediente
                  </Label>
                  <Input
                    id="expediente"
                    placeholder="8 dígitos"
                    maxLength={8}
                    {...register("expediente")}
                    className={
                      errors.expediente ? "border-status-critical" : ""
                    }
                  />
                  {errors.expediente && (
                    <p className="text-xs text-status-critical">
                      {errors.expediente.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Nombres */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre(s)</Label>
                  <Input
                    id="nombre"
                    placeholder="ej: Juan Carlos"
                    {...register("nombre")}
                    className={errors.nombre ? "border-status-critical" : ""}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-status-critical">
                      {errors.nombre.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paterno">Apellido Paterno</Label>
                  <Input
                    id="paterno"
                    placeholder="ej: García"
                    {...register("paterno")}
                    className={errors.paterno ? "border-status-critical" : ""}
                  />
                  {errors.paterno && (
                    <p className="text-xs text-status-critical">
                      {errors.paterno.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="materno">Apellido Materno</Label>
                  <Input
                    id="materno"
                    placeholder="ej: López"
                    {...register("materno")}
                    className={errors.materno ? "border-status-critical" : ""}
                  />
                  {errors.materno && (
                    <p className="text-xs text-status-critical">
                      {errors.materno.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Clínica y Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_clin">
                    <Building2 className="inline size-4 mr-1" />
                    Clínica Asignada
                  </Label>
                  <Select
                    value={watch("id_clin") || "null"}
                    onValueChange={(value) =>
                      setValue("id_clin", value === "null" ? null : value)
                    }
                    disabled={isLoadingClinics}
                  >
                    <SelectTrigger
                      className={errors.id_clin ? "border-status-critical" : ""}
                    >
                      <SelectValue
                        placeholder={
                          isLoadingClinics
                            ? "Cargando clínicas..."
                            : "Seleccioná una clínica"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Sin clínica asignada</SelectItem>
                      {clinicas.map((clinica: Clinica) => (
                        <SelectItem
                          key={clinica.id_clin}
                          value={clinica.id_clin.toString()}
                        >
                          {clinica.clinica} ({clinica.folio_clin})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.id_clin && (
                    <p className="text-xs text-status-critical">
                      {errors.id_clin.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correo">
                    <Mail className="inline size-4 mr-1" />
                    Correo Electrónico
                  </Label>
                  <Input
                    id="correo"
                    type="email"
                    placeholder="usuario@metro.cdmx.gob.mx"
                    {...register("correo")}
                    className={errors.correo ? "border-status-critical" : ""}
                  />
                  {errors.correo && (
                    <p className="text-xs text-status-critical">
                      {errors.correo.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Rol */}
              <div className="space-y-2">
                <Label htmlFor="rol">Rol del Usuario</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setValue("rol", value)}
                  disabled={isLoadingRoles}
                >
                  <SelectTrigger
                    className={errors.rol ? "border-status-critical" : ""}
                  >
                    <SelectValue
                      placeholder={
                        isLoadingRoles
                          ? "Cargando roles..."
                          : "Seleccioná un rol"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesData?.roles.map((role) => (
                      <SelectItem
                        key={role.id_rol}
                        value={role.id_rol.toString()}
                      >
                        {role.desc_rol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.rol && (
                  <p className="text-xs text-status-critical">
                    {errors.rol.message}
                  </p>
                )}
                {selectedRole && rolesData && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-txt-muted">
                      Rol seleccionado:
                    </span>
                    <Badge variant="info">
                      {
                        rolesData.roles.find(
                          (r) => r.id_rol.toString() === selectedRole,
                        )?.desc_rol
                      }
                    </Badge>
                  </div>
                )}
              </div>

              {/* Info Box - Contraseña Temporal (solo si se creó usuario) */}
              {tempPassword ? (
                <div className="p-4 bg-status-alert/10 border border-status-alert/30 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-status-alert">
                    ⚠️ CONTRASEÑA TEMPORAL GENERADA
                  </p>
                  <div className="p-3 bg-bg-paper border border-line-struct rounded font-mono text-sm">
                    <code className="text-brand font-bold tracking-wide">
                      {tempPassword}
                    </code>
                  </div>
                  <p className="text-xs text-txt-muted">
                    <strong>IMPORTANTE:</strong> Copiá esta contraseña y
                    entregala al usuario de forma segura. Esta es la única vez
                    que será visible. El usuario deberá cambiarla en su primer
                    acceso.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword);
                      toast.success("Contraseña copiada al portapapeles");
                    }}
                  >
                    📋 Copiar Contraseña
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-status-info/10 border border-status-info/30 rounded-lg">
                  <p className="text-sm text-txt-body">
                    <strong>Nota:</strong> El sistema generará una contraseña
                    temporal segura que será mostrada una única vez. El usuario
                    deberá cambiarla en su primer acceso y completar el proceso
                    de onboarding.
                  </p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-4 border-t border-line-struct">
                {tempPassword ? (
                  // Si ya se creó un usuario, mostrar botón para crear otro
                  <>
                    <Button
                      type="button"
                      onClick={handleCreateAnother}
                      className="flex-1"
                    >
                      <UserPlus className="mr-2 size-4" />
                      Crear Otro Usuario
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      <X className="mr-2 size-4" />
                      Limpiar
                    </Button>
                  </>
                ) : (
                  // Formulario normal
                  <>
                    <Button
                      type="submit"
                      disabled={isSubmitting || isLoadingRoles}
                      className="flex-1"
                    >
                      <Save className="mr-2 size-4" />
                      {isSubmitting ? "Creando..." : "Crear Usuario"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      <X className="mr-2 size-4" />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default CreateUserPage;
