import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/api/resources/auth.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const schema = z.object({
  code: z
    .string()
    .length(6, "El código debe tener 6 dígitos")
    .regex(/^\d+$/, "Solo se permiten números"),
});

interface Props {
  email: string;
  onSuccess: (token: string) => void;
  onBack: () => void;
}

export const VerifyOtpForm = ({ email, onSuccess, onBack }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setFocus,
  } = useForm<{ code: string }>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (code: string) => authAPI.verifyResetCode({ email, code }),
    onSuccess: (data) => {
      if (data.valid && data.reset_token) {
        toast.success("Código verificado");
        onSuccess(data.reset_token);
      } else {
        toast.error("Código inválido o expirado");
        reset();
        setTimeout(() => {
          setFocus("code");
        }, 10);
      }
    },
    onError: () => {
      toast.error("Error al verificar el código");
      reset();
      setTimeout(() => {
        setFocus("code");
      }, 10);
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutate(d.code))}
      className="space-y-6 animate-fade-in-up"
    >
      <div className="mt-4 text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand/10 text-brand mb-2">
          <ShieldCheck size={24} />
        </div>
        <p className="mt-2 text-sm text-txt-muted">
          Hemos enviado un código a <br />
          <span className="font-semibold text-txt-body">{email}</span>
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="otp" className="sr-only">
          Código de Verificación
        </label>
        <input
          id="otp"
          type="text"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="000000"
          className={cn(
            "w-full h-14 text-center text-2xl font-mono tracking-[0.5em] font-bold",
            "bg-paper border rounded-lg outline-none transition-all",
            errors.code
              ? "border-status-critical text-status-critical focus:ring-2 focus:ring-status-critical/20"
              : "border-line-struct text-txt-body focus:border-brand focus:ring-4 focus:ring-brand/10",
            "placeholder:text-txt-hint/30 placeholder:tracking-widest"
          )}
          disabled={isPending}
          {...register("code")}
        />
        {errors.code && (
          <p className="text-xs text-center text-status-critical font-medium animate-pulse">
            {errors.code.message}
          </p>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg transition-colors shadow-lg shadow-brand/20"
        >
          {isPending ? "Verificando..." : "Verificar Código"}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="w-full h-12 text-txt-muted hover:text-txt-body font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft size={16} /> Cambiar correo
        </button>
      </div>
    </form>
  );
};
