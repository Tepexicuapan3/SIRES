import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/api/resources/auth.api";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";

const schema = z
  .object({
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

interface Props {
  resetToken: string;
  onSuccess: () => void;
}

export const ResetPasswordForm = ({ resetToken, onSuccess }: Props) => {
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (newPassword: string) =>
      authAPI.resetPassword({
        reset_token: resetToken,
        new_password: newPassword,
      }),
    onSuccess: () => {
      toast.success("¡Contraseña actualizada!", {
        description: "Ya puedes iniciar sesión con tu nueva clave.",
      });
      onSuccess(); // Regresa al Login
    },
    onError: () =>
      toast.error("Error al actualizar contraseña", {
        description: "El token puede haber expirado. Intenta de nuevo.",
      }),
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutate(d.newPassword))}
      className="space-y-5 animate-fade-in-up"
    >
      <div className="my-6 mx-4 bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
        <p className="text-xs text-blue-600 dark:text-blue-300 flex gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          Tu identidad ha sido verificada. Ingresa tu nueva contraseña segura.
        </p>
      </div>

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

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 mt-4 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg transition-all shadow-md active:scale-[0.99]"
      >
        {isPending ? "Actualizando..." : "Restablecer Contraseña"}
      </button>
    </form>
  );
};
