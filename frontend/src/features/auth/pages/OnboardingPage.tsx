import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Lock } from "lucide-react";
import { ApiError, ERROR_CODES } from "@/api/utils/errors";

import { authAPI } from "@/api/resources/auth.api";
import { useLogout } from "@/features/auth/mutations/useLogout";
import {
  getAuthErrorMessage,
  onboardingErrorMessages,
} from "@features/auth/domain/auth.messages";
import { setAuthSession } from "@features/auth/utils/auth-cache";

import type { CompleteOnboardingResponse } from "@api/types";
import { TermsStep } from "@/features/auth/components/onboarding/TermsStep";
import { AuthPasswordForm } from "@/features/auth/components/shared/password/AuthPasswordForm";
import type { PasswordFormData } from "@features/auth/domain/auth.schemas";
import { ParticlesBackground } from "@/features/auth/animations/ParticlesBackground";
import { AuthCard } from "@/features/auth/components/shared/AuthCard";

/**
 * OnboardingPage
 * - Paso 1: aceptar términos
 * - Paso 2: crear contraseña
 */

type Step = "TERMS" | "PASSWORD";

export const OnboardingPage = () => {
  const [step, setStep] = useState<Step>("TERMS");
  const { mutate: logout, isPending: isLoggingOut, forceLogout } = useLogout();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { mutate: completeOnboarding, isPending } = useMutation({
    mutationFn: async (
      data: PasswordFormData,
    ): Promise<CompleteOnboardingResponse> => {
      return authAPI.completeOnboarding({
        newPassword: data.newPassword,
        termsAccepted: true,
      });
    },
    onSuccess: (response) => {
      if (response.user) {
        setAuthSession(queryClient, response.user);
      }

      toast.success("¡Cuenta activada!", {
        description: `¡Bienvenido, ${response.user?.fullName}!`,
      });

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    },
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;
      const errorMessage =
        error instanceof ApiError ? error.message : undefined;
      const errorStatus = error instanceof ApiError ? error.status : undefined;

      const displayMessage =
        getAuthErrorMessage(onboardingErrorMessages, errorCode) ||
        errorMessage ||
        "Error inesperado";

      if (
        errorStatus === 401 ||
        errorStatus === 403 ||
        errorCode === ERROR_CODES.TOKEN_EXPIRED ||
        errorCode === ERROR_CODES.TOKEN_INVALID ||
        errorCode === ERROR_CODES.SESSION_EXPIRED
      ) {
        toast.error("Sesión expirada", {
          description: `${displayMessage}. Redirigiendo al login...`,
        });
        forceLogout();
        return;
      }

      toast.error("Error al activar cuenta", { description: displayMessage });

      if (import.meta.env.DEV) {
        console.error("Error en onboarding:", error);
      }
    },
  });

  return (
    <main className="relative min-h-screen w-full bg-app flex items-center justify-center p-4 overflow-hidden">
      <ParticlesBackground quantity={200} staticity={7} ease={50} />
      <div className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-transparent to-app/80 pointer-events-none z-0" />

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => logout()}
          disabled={isLoggingOut || isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-txt-muted hover:text-status-critical hover:bg-status-critical/10 rounded-lg transition-colors disabled:opacity-50 backdrop-blur-sm bg-paper/30 min-h-11"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} aria-hidden="true" />
          {isLoggingOut ? "Cerrando..." : "Salir"}
        </button>
      </div>

      <div className="flex flex-col items-center w-full z-10">
        {step === "TERMS" && (
          <AuthCard maxWidth="lg" hideHeader>
            <TermsStep onAccept={() => setStep("PASSWORD")} />
          </AuthCard>
        )}

        {step === "PASSWORD" && (
          <AuthCard
            title="Crea tu contraseña"
            subtitle="Último paso para activar tu cuenta"
            maxWidth="md"
            showBackButton
            backButtonCorner
            customIcon={<Lock size={32} className="text-brand" />}
            onBack={() => setStep("TERMS")}
          >
            <AuthPasswordForm
              mode="onboarding"
              isPending={isPending}
              onSubmit={(data) => completeOnboarding(data)}
            />
          </AuthCard>
        )}
      </div>
    </main>
  );
};
