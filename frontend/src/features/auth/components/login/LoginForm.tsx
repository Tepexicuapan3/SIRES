import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, User, Lock, ArrowRight } from "lucide-react";
import { useLogin } from "@features/auth/mutations/useLogin";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  loginSchema,
  type LoginFormData,
} from "@features/auth/domain/auth.schemas";

interface Props {
  onForgotPassword: () => void;
}

/**
 * Formulario de login.
 *
 * NOTA DE SEGURIDAD: El rate limiting y bloqueo por intentos fallidos
 * se maneja EXCLUSIVAMENTE en el backend. No hay validación client-side
 * porque sería trivial de evadir (borrar localStorage, usar cURL, etc.)
 */
export const LoginForm = ({ onForgotPassword }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors },
    control,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false, username: "" },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedUser = window.localStorage.getItem("saved_username");
    if (savedUser) {
      setValue("username", savedUser);
      setValue("rememberMe", true);
    }
  }, [setValue]);

  const onSubmit = (data: LoginFormData) => {
    login(
      {
        username: data.username,
        password: data.password,
        rememberMe: data.rememberMe,
      },
      {
        onError: () => {
          setValue("password", "");
          setTimeout(() => {
            setFocus("password");
          }, 10);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
      {/* Inputs Group */}
      <div className="space-y-5">
        <FormField
          id="username"
          label="Usuario"
          placeholder="Ej. mperez123"
          icon={<User size={18} />}
          error={errors.username}
          disabled={isPending}
          autoComplete="username"
          {...register("username")}
        />

        <FormField
          id="password"
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          icon={<Lock size={18} />}
          error={errors.password}
          disabled={isPending}
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:text-brand transition-colors focus-visible:outline-none focus-visible:text-brand rounded-md"
              disabled={isPending}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          {...register("password")}
        />
      </div>

      {/* Checkbox Recordarme */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Controller
            name="rememberMe"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="rememberMe"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                disabled={isPending}
                aria-label="Recordar mi usuario en este dispositivo"
              />
            )}
          />
          <label
            htmlFor="rememberMe"
            className="text-sm text-txt-muted hover:text-txt-body transition-colors select-none cursor-pointer"
          >
            Recordarme
          </label>
        </div>

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm font-medium text-brand hover:text-brand-hover hover:underline underline-offset-4 decoration-2 transition-all"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {/* Botón Principal */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 group"
        size="lg"
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
      </Button>
    </form>
  );
};
