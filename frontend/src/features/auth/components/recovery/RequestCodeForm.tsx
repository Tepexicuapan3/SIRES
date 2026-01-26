import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/api/resources/auth.api";
import { toast } from "sonner";
import { ApiError } from "@/api/utils/errors";
import { recoveryErrorMessages } from "@features/auth/utils/errorMessages";

const schema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

interface Props {
  onSuccess: (email: string) => void;
  onCancel: () => void;
}

export const RequestCodeForm = ({ onSuccess, onCancel }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: authAPI.requestResetCode,
    onSuccess: (_, variables) => {
      toast.success("Código enviado", {
        description: "Revisa tu bandeja de entrada",
      });
      onSuccess(variables.email);
    },
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;
      const message = errorCode
        ? recoveryErrorMessages[
            errorCode as keyof typeof recoveryErrorMessages
          ] || "Error al enviar el código"
        : "Error al enviar el código";

      toast.error("Error", { description: message });

      if (import.meta.env.DEV) {
        console.error("Request code error:", error);
      }
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutate(data))}
      className="space-y-6 animate-fade-in-up"
    >
      <p className="mt-4 text-txt-muted text-sm sm:text-base font-normal max-w-xs mx-auto text-center">
        Ingresa tu correo y te enviaremos un código de 6 dígitos.
      </p>

      <FormField
        id="email"
        label="Correo Electrónico"
        icon={<Mail size={18} />}
        placeholder="usuario@metro.cdmx.gob.mx"
        error={errors.email}
        disabled={isPending}
        autoComplete="email"
        {...register("email")}
      />

      <div className="space-y-3 pt-2">
        <Button type="submit" disabled={isPending} className="w-full h-12">
          {isPending ? "Enviando..." : "Enviar Código"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
          className="w-full h-12 gap-2"
        >
          <ArrowLeft size={16} /> Volver al Login
        </Button>
      </div>
    </form>
  );
};
