import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";

import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { PasswordRequirements } from "./PasswordRequirements";
import { cn } from "@/lib/utils";
import {
  authPasswordSchema,
  type PasswordFormData,
} from "@features/auth/domain/auth.schemas";

interface Props {
  onSubmit: (data: PasswordFormData) => void;
  isPending: boolean;
  mode?: "recovery" | "onboarding";
}

export const AuthPasswordForm = ({
  onSubmit,
  isPending,
  mode = "recovery",
}: Props) => {
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(authPasswordSchema),
  });

  // Watch password value para validación en tiempo real
  const passwordValue = useWatch({
    control,
    name: "newPassword",
    defaultValue: "",
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 animate-fade-in-up"
    >
      {/* Banner Informativo - Adaptado a Metro CDMX */}
      <div
        className={cn(
          "mt-6 p-4 rounded-lg flex gap-3 items-start",
          mode === "recovery"
            ? "bg-status-info/10 dark:bg-status-info/20 border border-status-info/30 dark:border-status-info/40"
            : "bg-brand/5 dark:bg-brand/10 border border-brand/20 dark:border-brand/30",
        )}
      >
        {mode === "recovery" ? (
          <CheckCircle2
            size={20}
            className="text-status-info shrink-0 mt-0.5"
            aria-hidden="true"
          />
        ) : (
          <ShieldCheck
            size={20}
            className="text-brand shrink-0 mt-0.5"
            aria-hidden="true"
          />
        )}
        <div className="space-y-1">
          <p
            className={cn(
              "text-sm font-medium",
              mode === "recovery"
                ? "text-status-info dark:text-status-info"
                : "text-brand dark:text-brand",
            )}
          >
            {mode === "recovery" ? "Identidad Verificada" : "Activa tu Cuenta"}
          </p>
          <p
            className={cn(
              "text-xs leading-relaxed",
              mode === "recovery" ? "text-status-info/80" : "text-brand/80",
            )}
          >
            {mode === "recovery"
              ? "Ingresa tu nueva contraseña para recuperar el acceso."
              : "¡Ya casi! Solo falta establecer una contraseña segura."}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <FormField
          id="newPassword"
          label="Nueva Contraseña"
          type={showPass ? "text" : "password"}
          icon={<Lock size={18} />}
          error={errors.newPassword}
          disabled={isPending}
          autoComplete="new-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={
                showPass ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPass}
              className="text-txt-muted hover:text-brand transition-colors"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          {...register("newPassword")}
        />

        {passwordValue && passwordValue.length > 0 && (
          <PasswordRequirements password={passwordValue} />
        )}

        <FormField
          id="confirmPassword"
          label="Confirmar Contraseña"
          type={showPass ? "text" : "password"}
          icon={<Lock size={18} />}
          error={errors.confirmPassword}
          disabled={isPending}
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        size="default"
        className="w-full mt-4"
      >
        {isPending
          ? "Procesando..."
          : mode === "recovery"
            ? "Restablecer Contraseña"
            : "Finalizar y Acceder"}
      </Button>
    </form>
  );
};
