import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, ArrowLeft } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/api/resources/auth.api";
import { useLogout } from "../../hooks/useLogout";
import { cn } from "@/lib/utils";

import { CompleteOnboardingResponse } from "@/api/types/auth.types";
import { TermsStep } from "./TermsStep";
import {
  AuthPasswordForm,
  PasswordFormData,
} from "@/features/auth/components/AuthPasswordForm";

type Step = "TERMS" | "PASSWORD";

export const OnboardingPage = () => {
  const [step, setStep] = useState<Step>("TERMS");
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

const navigate = useNavigate();

// Mutación Principal: Completar Onboarding
  const { mutate: completeOnboarding, isPending } = useMutation({
    mutationFn: async (
      data: PasswordFormData
    ): Promise<CompleteOnboardingResponse> => {
      return authAPI.completeOnboarding({
        new_password: data.newPassword,
        terms_accepted: true,
      });
    },
onSuccess: (response) => {
      if (response.access_token && response.user) {
        useAuthStore.getState().setAuth(response.user, response.access_token, response.refresh_token);
      }
      
      toast.success("¡Cuenta activada!", {
        description: `¡Bienvenido, ${response.user?.nombre}!`,
      });

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    },
    onError: (error) => {
      console.error("Fallo onboarding:", error);
    },
  });

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4 relative">
      {/* Botón de Logout (Salida de Emergencia) */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => logout()}
          disabled={isLoggingOut || isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-txt-muted hover:text-status-critical hover:bg-status-critical/5 rounded-lg transition-colors disabled:opacity-50"
        >
          <LogOut size={16} />
          {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
        </button>
      </div>

      {/* Contenedor Principal (Estilo Liquid Glass / iOS) */}
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="bg-paper/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden relative">
          {/* Barra de Progreso Superior */}
          <div className="h-1 w-full bg-line-hairline">
            <div
              className={cn(
                "h-full bg-brand transition-all duration-500 ease-out",
                step === "TERMS" ? "w-1/2" : "w-full"
              )}
            />
          </div>

          <div className="p-8">
            {step === "TERMS" ? (
              <TermsStep onAccept={() => setStep("PASSWORD")} />
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Botón para volver a leer términos si quiere */}
                <button
                  onClick={() => setStep("TERMS")}
                  className="text-xs text-txt-muted flex items-center gap-1 hover:text-brand transition-colors"
                >
                  <ArrowLeft size={12} /> Volver a Términos
                </button>

                {/* Reutilizamos el Formulario de la Carpeta Auth */}
                <AuthPasswordForm
                  mode="onboarding"
                  isPending={isPending}
                  onSubmit={(data) => completeOnboarding(data)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer simple */}
        <p className="text-center mt-6 text-xs text-txt-muted opacity-60">
          Sistema Integral de Registro Electrónico para la Salud (SIRES)
        </p>
      </div>
    </div>
  );
};
