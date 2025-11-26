import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { ThemeToggle } from "@/features/settings/components/ThemeToggle";
import { FormField } from "@/components/ui/FormField";
import { useLogin } from "../hooks/useLogin";

// ============================================
// SCHEMA DE VALIDACIÓN
// ============================================
const loginSchema = z.object({
  usuario: z.string().min(1, "El correo o número de empleado es requerido"),
  clave: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const LoginPage = () => {
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
    <AuthLayout
      backgroundImage="/images/backgrounds/background-login.jpg"
      backgroundAlt="Metro CDMX - Estación"
    >
      {/* Theme Toggle - Posición fija */}
      <div className="fixed top-6 left-6 z-50">
        <ThemeToggle />
      </div>

      {/* Contenedor Principal */}
      <div className="w-full max-w-md animate-fade-in">
        {/* ============================================
            HEADER - Logo y Títulos
            ============================================ */}
        <header className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 ring-4 ring-primary/10">
              <img
                src="/icons/metro-logo-bn.svg"
                alt="Metro CDMX"
                className="w-12 h-12"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight">
            S I R E S
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Sistema de Información y Registro de Expedientes
          </p>
          <p className="text-sm text-muted-foreground mt-1">Metro CDMX</p>
        </header>

        {/* ============================================
            FORMULARIO - Card Principal
            ============================================ */}
        <div className="card-metro p-8 bg-card/80 backdrop-blur-xl border-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error de Autenticación */}
            {loginError && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl animate-shake">
                <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-destructive font-medium">
                  {loginError instanceof Error
                    ? loginError.message
                    : "Error al iniciar sesión. Verifica tus credenciales."}
                </p>
              </div>
            )}

            {/* Campo Usuario/Email */}
            <FormField
              id="usuario"
              label="Correo Electrónico o Número de Empleado"
              type="text"
              placeholder="usuario@metro.cdmx.mx"
              icon={<Mail className="w-5 h-5" />}
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
              icon={<Lock className="w-5 h-5" />}
              error={errors.clave}
              disabled={isPending}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
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
            <div className="flex items-center space-x-3 group">
              <input
                type="checkbox"
                id="rememberMe"
                className="w-5 h-5 rounded-md border-2 border-input bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                {...register("rememberMe")}
                disabled={isPending}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm font-medium cursor-pointer text-foreground group-hover:text-primary transition-colors select-none"
              >
                Mantener sesión iniciada en este dispositivo
              </label>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="btn-metro w-full h-12 text-base font-bold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>

            {/* Enlaces de Ayuda */}
            <div className="flex items-center justify-between text-sm pt-4 border-t border-border/50">
              <a
                href="#forgot-password"
                className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
              <a
                href="#help"
                className="text-muted-foreground hover:text-foreground transition-colors hover:underline"
              >
                Necesitas ayuda
              </a>
            </div>
          </form>
        </div>

        {/* ============================================
            FOOTER - Información de Seguridad
            ============================================ */}
        <footer className="mt-8 space-y-4 text-center">
          {/* Mensaje de Seguridad */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <span className="font-medium">
              Conexión segura - Tus datos están protegidos
            </span>
          </div>

          {/* Copyright */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">
              Sistema de Información y Registro de Expedientes
            </p>
            <p>
              Sistema de Transporte Colectivo Metro CDMX ©{" "}
              {new Date().getFullYear()}
            </p>
          </div>

          {/* Versión */}
          <p className="text-xs text-muted-foreground/60">
            Versión 1.0.0 - Producción
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
};
