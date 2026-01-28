import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../components/login/LoginForm";
import { RequestCodeForm } from "../components/recovery/RequestCodeForm";
import { VerifyOtpForm } from "../components/recovery/VerifyOtpForm";
import { AuthPasswordForm } from "../components/shared/password/AuthPasswordForm";
import { ParticlesBackground } from "../animations/ParticlesBackground";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "@/api/resources/auth.api";
import { toast } from "sonner";
import type { ResetPasswordResponse } from "@api/types";
import {
  getAuthErrorMessage,
  recoveryErrorMessages,
} from "@features/auth/domain/auth.messages";
import { cn } from "@/lib/utils";
import { setAuthSession } from "@features/auth/utils/auth-cache";
import { ApiError, ERROR_CODES } from "@api/utils/errors";
import { AuthCard } from "@features/auth/components/shared/AuthCard";
import type { PasswordFormData } from "@features/auth/domain/auth.schemas";

export type AuthViewState =
  | "LOGIN"
  | "RECOVERY_REQUEST"
  | "RECOVERY_OTP"
  | "RECOVERY_NEW_PASS";

const recoverySteps: AuthViewState[] = [
  "RECOVERY_REQUEST",
  "RECOVERY_OTP",
  "RECOVERY_NEW_PASS",
];

const viewTitles: Record<AuthViewState, string> = {
  LOGIN: "S I R E S",
  RECOVERY_REQUEST: "¿Olvidaste tu contraseña?",
  RECOVERY_OTP: "Verifica tu identidad",
  RECOVERY_NEW_PASS: "Restablecer contraseña",
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewState, setViewState] = useState<AuthViewState>("LOGIN");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const recoveryIndex = recoverySteps.indexOf(viewState);

  const { mutate: resetPassword, isPending: isResetting } = useMutation({
    mutationFn: (data: PasswordFormData) =>
      authAPI.resetPassword({
        newPassword: data.newPassword,
      }),
    onSuccess: (response: ResetPasswordResponse) => {
      setAuthSession(queryClient, response.user);

      if (response.requiresOnboarding) {
        toast.info("Configuración inicial requerida", {
          description: "Por favor acepta los términos para continuar.",
        });
        navigate("/onboarding", { replace: true });
        return;
      }

      toast.success("¡Contraseña actualizada!", {
        description: "Bienvenido de vuelta.",
      });

      const landingRoute = response.user.landingRoute || "/dashboard";
      navigate(landingRoute, { replace: true });
    },
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;

      const message =
        getAuthErrorMessage(recoveryErrorMessages, errorCode) ||
        (errorCode
          ? "Error al restablecer la contraseña"
          : "El token ha expirado, solicita uno nuevo");

      toast.error("Error al restablecer", { description: message });

      const tokenErrors: string[] = [
        ERROR_CODES.TOKEN_EXPIRED,
        ERROR_CODES.TOKEN_INVALID,
        ERROR_CODES.SESSION_EXPIRED,
        ERROR_CODES.REFRESH_TOKEN_EXPIRED,
      ];
      if (errorCode && tokenErrors.includes(errorCode)) {
        toast.info("Reiniciando proceso", {
          description: "Por favor solicita un nuevo código de verificación.",
        });
        setViewState("RECOVERY_REQUEST");
      }
    },
  });

  return (
    <main className="relative min-h-screen w-full bg-app flex items-center justify-center p-4 overflow-hidden">
      {/* === BACKGROUND ANIMADO === */}
      <ParticlesBackground
        quantity={400} // Cantidad justa para no saturar
        staticity={7} // Movimiento lento y estable
        ease={50} // Suavidad alta
      />
      {/* Gradiente radial sutil para dar profundidad sin afectar legibilidad */}
      <div
        className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-transparent to-app/90 pointer-events-none z-0"
        aria-hidden="true"
      />

      <AuthCard
        title={viewTitles[viewState]}
        subtitle={
          viewState === "LOGIN"
            ? "Sistema de Información de Registro Electrónico para la Salud"
            : undefined
        }
        titleClassName={
          viewState === "LOGIN" ? "text-2xl sm:text-3xl" : undefined
        }
        subtitleClassName={viewState === "LOGIN" ? "text-lg" : undefined}
      >
        {viewState !== "LOGIN" && (
          <div
            className="flex items-center justify-center gap-3 mb-6"
            role="progressbar"
            aria-label="Progreso de recuperación"
            aria-valuemin={0}
            aria-valuemax={recoverySteps.length - 1}
            aria-valuenow={Math.max(recoveryIndex, 0)}
          >
            {recoverySteps.map((step, idx) => {
              const isActive = viewState === step;
              const isCompleted = recoveryIndex > idx;

              return (
                <div
                  key={step}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    isActive && "bg-brand scale-125 shadow-lg shadow-brand/50",
                    isCompleted && "bg-brand/40",
                    !isActive && !isCompleted && "bg-line-struct",
                  )}
                  aria-label={`Paso ${idx + 1} de ${recoverySteps.length}${isActive ? " (actual)" : ""}${isCompleted ? " (completado)" : ""}`}
                />
              );
            })}
          </div>
        )}

        {viewState === "LOGIN" && (
          <LoginForm
            onForgotPassword={() => setViewState("RECOVERY_REQUEST")}
          />
        )}

        {viewState === "RECOVERY_REQUEST" && (
          <RequestCodeForm
            onSuccess={(email) => {
              setRecoveryEmail(email);
              setViewState("RECOVERY_OTP");
            }}
            onCancel={() => {
              setRecoveryEmail("");
              setViewState("LOGIN");
            }}
          />
        )}

        {viewState === "RECOVERY_OTP" && recoveryEmail && (
          <VerifyOtpForm
            email={recoveryEmail}
            onSuccess={() => {
              // El token de reset se setea en cookie por el backend
              setViewState("RECOVERY_NEW_PASS");
            }}
            onBack={() => setViewState("RECOVERY_REQUEST")}
          />
        )}

        {viewState === "RECOVERY_OTP" && !recoveryEmail && (
          <RequestCodeForm
            onSuccess={(email) => {
              setRecoveryEmail(email);
              setViewState("RECOVERY_OTP");
            }}
            onCancel={() => {
              setRecoveryEmail("");
              setViewState("LOGIN");
            }}
          />
        )}

        {viewState === "RECOVERY_NEW_PASS" && (
          <AuthPasswordForm
            mode="recovery"
            isPending={isResetting}
            onSubmit={(data) => resetPassword(data)}
          />
        )}
      </AuthCard>
    </main>
  );
};
