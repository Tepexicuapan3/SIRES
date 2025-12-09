import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/api/resources/auth.api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FormField } from "@/components/ui/FormField";
import { Lock, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// Schema de validación
const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Al menos una mayúscula")
      .regex(/[0-9]/, "Al menos un número")
      .regex(/[^a-zA-Z0-9]/, "Al menos un símbolo especial"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export const ChangePasswordStep = () => {
  const navigate = useNavigate();
  // Necesitamos actualizar el usuario en el store global al terminar
  const { user, setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      authAPI.completeOnboarding({
        new_password: data.newPassword,
        terms_accepted: true,
        // current_password: "..." // Si el backend lo pide, habría que pedirlo o sacarlo de algún lado
      }),
    onSuccess: (response) => {
      toast.success("¡Cuenta activada correctamente!");

      // Actualizamos el usuario localmente para quitar la bandera "must_change_password"
      // y actualizamos el token si el backend nos dio uno nuevo
      if (user) {
        setUser({ ...user, must_change_password: false });
      }

      if (response.access_token) {
        localStorage.setItem("access_token", response.access_token);
      }

      // Redirigir al Dashboard
      navigate("/dashboard", { replace: true });
    },
    onError: () => toast.error("Error al activar la cuenta"),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-brand">
          Seguridad de la Cuenta
        </h2>
        <p className="text-txt-muted">
          Para finalizar, establece una contraseña segura y personal.
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-5">
        <FormField
          id="newPassword"
          label="Nueva Contraseña"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={18} />}
          error={errors.newPassword}
          disabled={isPending}
          {...register("newPassword")}
        />

        <FormField
          id="confirmPassword"
          label="Confirmar Contraseña"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={18} />}
          error={errors.confirmPassword}
          disabled={isPending}
          {...register("confirmPassword")}
        />

        <div className="text-xs text-txt-muted bg-paper-hover p-3 rounded border border-line-struct">
          <p className="font-semibold mb-1">Requisitos:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Mínimo 8 caracteres</li>
            <li>Al menos una mayúscula y un número</li>
            <li>Al menos un carácter especial (@, #, $, etc.)</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          {isPending ? (
            "Activando..."
          ) : (
            <>
              Finalizar y Acceder <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
