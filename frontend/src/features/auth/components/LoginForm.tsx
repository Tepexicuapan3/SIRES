import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, User, Lock, ArrowRight } from "lucide-react";
import { useLogin } from "../hooks/useLogin";
import { FormField } from "@/components/ui/FormField";

// Schema
const loginSchema = z.object({
  usuario: z
    .string()
    .min(1, "El usuario es requerido")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9]+$/, "Solo letras y números"),
  clave: z.string().min(1, "La contraseña es requerida"),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface Props {
  onForgotPassword: () => void;
}

/**
 * Formulario de login.
 *
 * NOTA DE SEGURIDAD: El rate limiting y bloqueo por intentos fallidos
 * se maneja EXCLUSIVAMENTE en el backend. No hay validación client-side
 * porque sería trivial de evadir (borrar localStorage, usar cURL, etc.)
 *
 * @see backend/docs/RATE_LIMITING.md
 */
export const LoginForm = ({ onForgotPassword }: Props) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false, usuario: "" },
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("saved_username");
    if (savedUser) {
      setValue("usuario", savedUser);
      setValue("rememberMe", true);
    }
  }, [setValue]);

  const onSubmit = (data: LoginFormData) => {
    login(
      { usuario: data.usuario, clave: data.clave, rememberMe: data.rememberMe },
      {
        onError: () => {
          setValue("clave", "");
          setTimeout(() => {
            setFocus("clave");
          }, 10);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
      <p className="mt-2 text-txt-muted text-sm sm:text-base font-normal max-w-xs mx-auto text-center">
        Sistema de Información de Registro Electrónico para la Salud
      </p>

      {/* Inputs Group */}
      <div className="space-y-5">
        <FormField
          id="usuario"
          label="No. Expediente o Usuario"
          placeholder="Ej. mperez123"
          icon={<User size={18} />}
          error={errors.usuario}
          disabled={isPending}
          {...register("usuario")}
        />

        <FormField
          id="clave"
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          icon={<Lock size={18} />}
          error={errors.clave}
          disabled={isPending}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:text-brand transition-colors focus:outline-none focus:text-brand rounded-md"
              disabled={isPending}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          {...register("clave")}
        />
      </div>

      {/* Checkbox Recordarme */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer h-4 w-4 appearance-none rounded border border-line-struct bg-paper checked:bg-brand checked:border-brand focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer"
              {...register("rememberMe")}
              disabled={isPending}
            />
            {/* Checkmark SVG personalizado para control total */}
            <svg
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <span className="text-sm text-txt-muted group-hover:text-txt-body transition-colors select-none">
            Recordarme
          </span>
        </label>

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm font-medium text-brand hover:text-brand-hover hover:underline underline-offset-4 decoration-2 transition-all"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {/* Botón Principal */}
      <button
        type="submit"
        disabled={isPending}
        className="
          group relative w-full h-12 flex items-center justify-center gap-2 
          bg-brand hover:bg-brand-hover active:scale-[0.99]
          text-white font-semibold rounded-lg shadow-md hover:shadow-lg
          transition-all duration-200 disabled:opacity-70 disabled:cursor-wait
        "
      >
        {isPending ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Iniciar Sesión
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </>
        )}
      </button>
    </form>
  );
};
