import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, ArrowLeft } from "lucide-react";
import { AxiosError } from "axios";

import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/api/resources/auth.api";
import { useLogout } from "../../hooks/useLogout";

import { CompleteOnboardingResponse } from "@/api/types/auth.types";
import { TermsStep } from "./TermsStep";
import {
  AuthPasswordForm,
  PasswordFormData,
} from "@/features/auth/components/AuthPasswordForm";
import { ParticlesBackground } from "../../animations/ParticlesBackground";

type Step = "TERMS" | "PASSWORD";

interface OnboardingError {
  code: string;
  message: string;
}

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
        useAuthStore
          .getState()
          .setAuth(
            response.user,
            response.access_token,
            response.refresh_token
          );
      }

      toast.success("¡Cuenta activada!", {
        description: `¡Bienvenido, ${response.user?.nombre}!`,
      });

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    },
    onError: (error: AxiosError<OnboardingError> | Error) => {
      const axiosError = error as AxiosError<OnboardingError>;
      const errorCode = axiosError.response?.data?.code;
      const errorMessage = axiosError.response?.data?.message;

      const errorMessages: Record<string, string> = {
        PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres",
        PASSWORD_NO_UPPERCASE:
          "La contraseña debe incluir al menos una mayúscula",
        PASSWORD_NO_NUMBER: "La contraseña debe incluir al menos un número",
        PASSWORD_NO_SPECIAL:
          "La contraseña debe incluir al menos un carácter especial",
        PASSWORD_REQUIRED: "La contraseña es requerida",
        ONBOARDING_NOT_REQUIRED: "Tu cuenta ya está activada. Redirigiendo...",
        TERMS_NOT_ACCEPTED: "Debes aceptar los términos y condiciones",
        INVALID_SCOPE: "Tu sesión expiró. Por favor inicia sesión nuevamente.",
        INVALID_TOKEN: "Sesión inválida. Por favor inicia sesión nuevamente.",
        USER_NOT_FOUND: "Usuario no encontrado",
        PASSWORD_UPDATE_FAILED:
          "Error al actualizar la contraseña. Intenta de nuevo.",
        ONBOARDING_UPDATE_FAILED:
          "Error al completar la activación. Intenta de nuevo.",
        SERVER_ERROR: "Error del servidor. Intenta más tarde.",
      };

      const displayMessage =
        errorMessages[errorCode || ""] || errorMessage || "Error inesperado";

      if (errorCode === "INVALID_SCOPE" || errorCode === "INVALID_TOKEN") {
        toast.error("Sesión expirada", { description: displayMessage });
        setTimeout(() => logout(), 2000);
        return;
      }

      if (errorCode === "ONBOARDING_NOT_REQUIRED") {
        toast.info("Cuenta ya activada", {
          description: "Redirigiendo al dashboard...",
        });
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
        return;
      }

      toast.error("Error al activar cuenta", { description: displayMessage });
      console.error("Error en onboarding:", axiosError);
    },
  });

  return (
    <main className="relative min-h-screen w-full bg-app flex items-center justify-center p-4 overflow-hidden">
      {/* === BACKGROUND ANIMADO === */}
      <ParticlesBackground quantity={200} staticity={7} ease={50} />
      <div className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-transparent to-app/80 pointer-events-none z-0" />

      {/* Botón de Logout - Flotante */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => logout()}
          disabled={isLoggingOut || isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-txt-muted hover:text-status-critical hover:bg-status-critical/10 rounded-lg transition-colors disabled:opacity-50 backdrop-blur-sm bg-paper/30"
        >
          <LogOut size={16} />
          {isLoggingOut ? "Cerrando..." : "Salir"}
        </button>
      </div>

      {/* === PASO 1: TÉRMINOS Y CONDICIONES (Card Grande) === */}
      {step === "TERMS" && (
        <div className="w-full max-w-2xl z-10 animate-fade-in-up">
          <TermsStep onAccept={() => setStep("PASSWORD")} />

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-txt-muted/70">
            © {new Date().getFullYear()} Sistema de Transporte Colectivo.
            <br className="sm:hidden" /> Activación de cuenta de usuario.
          </p>
        </div>
      )}

      {/* === PASO 2: CONTRASEÑA (Card Normal - igual que Login) === */}
      {step === "PASSWORD" && (
        <div className="w-full max-w-md z-10 animate-fade-in-up">
          <div className="relative rounded-3xl p-8 sm:p-10 overflow-hidden bg-paper/60 dark:bg-paper/40 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-2xl shadow-black/10">
            {/* Header con Logo */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-xl shadow-brand/20 mb-4 transition-all duration-300 hover:scale-105">
                <img
                  src="/SIRES.webp"
                  alt="Logo SIRES"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-txt-body mb-4">
                S I R E S
              </h1>

              <h2 className="text-lg sm:text-xl text-txt-body">
                Crea tu Contraseña
              </h2>
              <p className="text-sm text-txt-muted mt-2">
                Establece una contraseña segura para tu cuenta
              </p>
            </div>

            {/* Botón para volver */}
            <button
              onClick={() => setStep("TERMS")}
              className="text-xs text-txt-muted flex items-center gap-1 hover:text-brand transition-colors mb-4"
            >
              <ArrowLeft size={16} /> Volver a Términos
            </button>

            {/* Formulario */}
            <AuthPasswordForm
              mode="onboarding"
              isPending={isPending}
              onSubmit={(data) => completeOnboarding(data)}
            />
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-txt-muted/70">
            © {new Date().getFullYear()} Sistema de Transporte Colectivo.
            <br className="sm:hidden" /> Activación de cuenta de usuario.
          </p>
        </div>
      )}
    </main>
  );
};
