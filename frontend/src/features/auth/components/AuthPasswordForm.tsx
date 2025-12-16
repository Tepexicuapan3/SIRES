import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { FormField } from "@/components/ui/FormField";

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
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 animate-fade-in-up"
    >
      <div className="mt-6 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3 items-start">
        {mode === "recovery" ? (
          <CheckCircle2
            size={20}
            className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
          />
        ) : (
          <ShieldCheck
            size={20}
            className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
          />
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {mode === "recovery" ? "Identidad Verificada" : "Activa tu Cuenta"}
          </p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
            {mode === "recovery"
              ? "Ingresa tu nueva contraseña para recuperar el acceso."
              : "Establece una contraseña segura para finalizar tu registro."}
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 mt-4 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg transition-all shadow-md active:scale-[0.99]"
      >
        {isPending
          ? "Procesando..."
          : mode === "recovery"
          ? "Restablecer Contraseña"
          : "Finalizar y Acceder"}
      </button>
    </form>
  );
};
