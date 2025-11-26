import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useLogin } from "../hooks/useLogin";
import { FormField } from "@/components/ui/FormField";

// ============================================
// SCHEMA DE VALIDACIÓN
// ============================================
const loginSchema = z.object({
  usuario: z
    .string()
    .min(1, "El usuario es requerido")
    .max(20, "El usuario no puede tener más de 20 caracteres")
    .regex(/^[a-zA-Z0-9]+$/, "Solo se permiten letras y números"),
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
    <div className="liquid-glass-card">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error de autenticación */}
        {loginError && (
          <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/30 rounded-2xl animate-shake backdrop-blur-sm">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <p className="text-sm text-primary font-medium font-sans">
              {loginError instanceof Error
                ? loginError.message
                : "Error al iniciar sesión"}
            </p>
          </div>
        )}

        {/* Campo Usuario */}
        <FormField
          id="usuario"
          label="Usuario"
          type="text"
          placeholder="usuario123"
          icon={<Mail className="w-5 h-5" />}
          error={errors.usuario}
          disabled={isPending}
          maxLength={20}
          {...register("usuario")}
        />

        {/* Campo Contraseña */}
        <FormField
          id="clave"
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5" />}
          error={errors.clave}
          disabled={isPending}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              disabled={isPending}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          }
          {...register("clave")}
        />

        {/* Checkbox Recordarme */}
        <div className="flex items-center gap-3 group">
          <input
            type="checkbox"
            id="rememberMe"
            className="w-5 h-5 rounded-lg border-2 border-border bg-background text-primary 
                     focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer 
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     checked:bg-primary checked:border-primary"
            {...register("rememberMe")}
            disabled={isPending}
          />
          <label
            htmlFor="rememberMe"
            className="text-sm font-medium cursor-pointer text-foreground 
                     group-hover:text-primary transition-colors select-none font-sans"
          >
            Recordarme en este dispositivo
          </label>
        </div>

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-primary text-white font-bold text-base rounded-2xl
                   shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30
                   hover:bg-primary/90 active:scale-[0.98] transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-3 font-metro"
        >
          {isPending ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>Iniciando sesión...</span>
            </>
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
