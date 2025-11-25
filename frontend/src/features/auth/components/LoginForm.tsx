import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useLogin } from "../hooks/useLogin";
import { FormField } from "./FormField";

const loginSchema = z.object({
  usuario: z.string().min(1, "El correo o número de empleado es requerido"),
  clave: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending, error: loginError } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login({
      usuario: data.usuario,
      clave: data.clave,
    });
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl shadow-2xl p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error de autenticación */}
        {loginError && (
          <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              {loginError instanceof Error
                ? loginError.message
                : "Error al iniciar sesión"}
            </p>
          </div>
        )}

        {/* Campo Email/Usuario */}
        <FormField
          id="usuario"
          label="Correo o Número de Empleado"
          type="text"
          placeholder="usuario@metro.cdmx.mx"
          icon={<Mail className="w-4 h-4" />}
          error={errors.usuario}
          disabled={isPending}
          {...register("usuario")}
        />

        {/* Campo Contraseña */}
        <FormField
          id="clave"
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          icon={<Lock className="w-4 h-4" />}
          error={errors.clave}
          disabled={isPending}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              disabled={isPending}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
          {...register("clave")}
        />

        {/* Checkbox Recordarme */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="rememberMe"
            className="h-4 w-4 shrink-0 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground cursor-pointer accent-primary"
            {...register("rememberMe")}
            disabled={isPending}
          />
          <label
            htmlFor="rememberMe"
            className="text-sm font-normal cursor-pointer text-foreground select-none"
          >
            Recordarme en este dispositivo
          </label>
        </div>

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl active:scale-[0.98] w-full h-11"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Iniciando sesión...
            </span>
          ) : (
            "Iniciar Sesión"
          )}
        </button>

        {/* Enlaces Secundarios */}
        <div className="flex items-center justify-between text-xs pt-2">
          <a
            href="#forgot-password"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </a>
          <a
            href="#help"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Necesitas ayuda
          </a>
        </div>
      </form>
    </div>
  );
};
