import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";

import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { PasswordRequirements } from "./PasswordRequirements";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Al menos una mayúscula")
      .regex(/[0-9]/, "Al menos un número")
      .regex(/[^a-zA-Z0-9]/, "Al menos un carácter especial (@, #, etc.)"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type PasswordFormData = z.infer<typeof schema>;

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
    resolver: zodResolver(schema),
  });

  // Watch password value para validación en tiempo real
  // useWatch es preferido por React Compiler (memoization-safe)
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
      {/* 
        Banner Informativo - Adaptado a Metro CDMX
        
        DECISIÓN DE DISEÑO:
        - Recovery: usa status-info (azul institucional para información administrativa)
        - Onboarding: usa brand (naranja Metro para reforzar la marca en activación)
        
        RAZONAMIENTO:
        - Recovery es un proceso de soporte → info neutral (azul)
        - Onboarding es el primer contacto con la marca → brand identity (naranja)
      */}
      <div
        className={
          mode === "recovery"
            ? "mt-6 bg-status-info/10 dark:bg-status-info/20 p-4 rounded-lg border border-status-info/30 dark:border-status-info/40 flex gap-3 items-start"
            : "mt-6 bg-brand/5 dark:bg-brand/10 p-4 rounded-lg border border-brand/20 dark:border-brand/30 flex gap-3 items-start"
        }
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
            className={
              mode === "recovery"
                ? "text-sm font-medium text-status-info dark:text-status-info"
                : "text-sm font-medium text-brand dark:text-brand"
            }
          >
            {mode === "recovery" ? "Identidad Verificada" : "Activa tu Cuenta"}
          </p>
          <p
            className={
              mode === "recovery"
                ? "text-xs text-status-info/80 leading-relaxed"
                : "text-xs text-brand/80 leading-relaxed"
            }
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
          rightElement={
            <button type="button" onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          {...register("newPassword")}
        />

        {/* 
          Validación en Tiempo Real (NUEVA FUNCIONALIDAD)
          
          MEJORA UX IMPLEMENTADA:
          - Feedback progresivo mientras el usuario tipea
          - Checklist visual de requisitos cumplidos
          - Barra de progreso 0/4 → 4/4
          - Reduce frustración de "submit fallido"
          
          DECISIÓN DE DISEÑO:
          - Solo se muestra cuando el usuario empieza a escribir (no abruma al inicio)
        */}
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
