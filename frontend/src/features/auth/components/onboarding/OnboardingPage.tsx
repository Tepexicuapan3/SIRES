import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Lock } from "lucide-react";
import { AxiosError } from "axios";

import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/api/resources/auth.api";
import { useLogout } from "../../hooks/useLogout";
import { onboardingErrorMessages } from "../../utils/errorMessages";

import { CompleteOnboardingResponse } from "@/api/types/auth.types";
import { TermsStep } from "./TermsStep";
import {
  AuthPasswordForm,
  PasswordFormData,
} from "@/features/auth/components/AuthPasswordForm";
import { ParticlesBackground } from "../../animations/ParticlesBackground";
import { AuthCard } from "../shared/AuthCard";

/**
 * OnboardingPage - Flujo de Activación de Cuenta (2 Pasos)
 *
 * REFACTORIZACIÓN (Code Review):
 * ✅ Consistencia visual: Ambos pasos usan AuthCard (mismo header/footer)
 * ✅ Código DRY: Header/footer ya no duplicados
 * ✅ Responsividad: maxWidth configurable por paso (md para PASSWORD, md para TERMS)
 * ✅ Navegación: Botón "Volver" en paso PASSWORD
 *
 * FLUJO:
 * 1. TERMS → Usuario acepta Acta Responsiva (checkbox obligatorio)
 * 2. PASSWORD → Usuario crea contraseña segura (validación Zod)
 * 3. Redirección a /dashboard tras completar onboarding
 *
 * SEGURIDAD:
 * - JWT con scope "onboarding_required" (validado en backend)
 * - Tokens en cookies HttpOnly (backend los setea tras completar)
 * - Logout disponible en todo momento (botón flotante)
 *
 * @see backend/src/use_cases/auth/complete_onboarding_usecase.py
 * @see AuthCard.tsx - Wrapper reutilizable
 */

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
      // Guardar datos del usuario en el store
      // Los tokens ya están en HttpOnly cookies (seteados por el backend)
      if (response.user) {
        useAuthStore.getState().setAuth(response.user);
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

      const displayMessage =
        onboardingErrorMessages[errorCode || ""] ||
        errorMessage ||
        "Error inesperado";

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

      // Solo loggear errores en desarrollo (no exponer info en producción)
      if (import.meta.env.DEV) {
        console.error("Error en onboarding:", axiosError);
      }
    },
  });

  return (
    <main className="relative min-h-screen w-full bg-app flex items-center justify-center p-4 overflow-hidden">
      {/* === BACKGROUND ANIMADO === */}
      <ParticlesBackground quantity={200} staticity={7} ease={50} />
      <div className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-transparent to-app/80 pointer-events-none z-0" />

      {/* Botón de Logout - Flotante */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => logout()}
          disabled={isLoggingOut || isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-txt-muted hover:text-status-critical hover:bg-status-critical/10 rounded-lg transition-colors disabled:opacity-50 backdrop-blur-sm bg-paper/30 min-h-[44px]"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} aria-hidden="true" />
          {isLoggingOut ? "Cerrando..." : "Salir"}
        </button>
      </div>

      {/* 
        === CONTENEDOR CENTRALIZADO ===
        Card único centrado verticalmente y horizontalmente
      */}
      <div className="flex flex-col items-center w-full z-10">
        {/* 
          === PASO 1: TÉRMINOS Y CONDICIONES ===
          
          DISEÑO INSTITUCIONAL:
          - maxWidth="lg" (672px): Card ANCHA para lectura de documento legal
          - hideHeader: TERMS tiene su propio header institucional (Metro + SIRES)
          - NO necesita title/subtitle: TermsStep renderiza su propio header completo
          
          RAZONAMIENTO:
          - Es un ACTA RESPONSIVA (documento legal/institucional)
          - Requiere peso visual con logos oficiales (dual branding)
          - Gradiente naranja → identidad Metro CDMX
        */}
        {step === "TERMS" && (
          <AuthCard maxWidth="lg" hideHeader>
            <TermsStep onAccept={() => setStep("PASSWORD")} />
          </AuthCard>
        )}

        {/* 
          === PASO 2: CREAR CONTRASEÑA ===
          
          REFACTOR v2 (Iteración 3):
          - Botón Volver en esquina superior (backButtonCorner={true})
          - Ícono Lock reemplaza logo SIRES (customIcon)
          - Textos motivacionales: "Crea tu contraseña" + "Último paso para activar tu cuenta"
          
          DISEÑO INTENCIONAL:
          - maxWidth="md" (448px): Card COMPACTA para formulario simple (2 campos)
          - customIcon={<Lock />}: Refuerza seguridad + más motivacional que logo institucional
          - backButtonCorner: NO desplaza contenido del header
          
          UX RATIONALE:
          - Usuario siente que está "casi listo" (mensajes motivacionales)
          - Lock icon = seguridad (no burocracia)
          - Botón esquina = más espacio para header (no apretado)
        */}
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
