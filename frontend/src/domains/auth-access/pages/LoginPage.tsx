import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "@api/resources/auth.api";
import { toast } from "sonner";
import type { ResetPasswordResponse } from "@api/types";
import { cn } from "@shared/utils/styling/cn";
import { ApiError, ERROR_CODES } from "@api/utils/errors";

import { LoginForm } from "@/domains/auth-access/components/login/LoginForm";
import { RequestCodeForm } from "@/domains/auth-access/components/recovery/RequestCodeForm";
import { VerifyOtpForm } from "@/domains/auth-access/components/recovery/VerifyOtpForm";
import { AuthPasswordForm } from "@/domains/auth-access/components/shared/password/AuthPasswordForm";
import { AuthCard } from "@/domains/auth-access/components/shared/AuthCard";
import {
  getAuthErrorMessage,
  recoveryErrorMessages,
} from "@/domains/auth-access/types/auth.messages";
import type { PasswordFormData } from "@/domains/auth-access/types/auth.schemas";
import { setAuthSession } from "@/domains/auth-access/adapters/auth-cache";
import { ParticlesBackground } from "@/domains/auth-access/components/shared/ParticlesBackground";

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
  LOGIN: "SISEM",
  RECOVERY_REQUEST: "¿Olvidaste tu contraseña?",
  RECOVERY_OTP: "Verifica tu identidad",
  RECOVERY_NEW_PASS: "Restablecer contraseña",
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewState, setViewState] = useState<AuthViewState>("LOGIN");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [shouldAutoFocusEmail, setShouldAutoFocusEmail] = useState(false);

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
      const errorStatus = error instanceof ApiError ? error.status : undefined;
      const errorMessage =
        error instanceof ApiError ? error.message : undefined;

      const tokenErrors: string[] = [
        ERROR_CODES.TOKEN_EXPIRED,
        ERROR_CODES.TOKEN_INVALID,
        ERROR_CODES.SESSION_EXPIRED,
        ERROR_CODES.REFRESH_TOKEN_EXPIRED,
      ];
      const isTokenError =
        errorStatus === 401 ||
        errorStatus === 403 ||
        (errorCode && tokenErrors.includes(errorCode));

      const message =
        getAuthErrorMessage(recoveryErrorMessages, errorCode) ||
        errorMessage ||
        (errorCode
          ? "Error al restablecer la contraseña"
          : "El token ha expirado, solicita uno nuevo");

      if (isTokenError) {
        toast.error("Sesión expirada", {
          description: `${message}. Solicita un nuevo código de verificación.`,
        });
        setShouldAutoFocusEmail(true);
        setViewState("RECOVERY_REQUEST");
        return;
      }

      toast.error("Error al restablecer", { description: message });
    },
  });

  return (
    <main className="relative min-h-screen w-full bg-app flex items-center justify-center p-4 overflow-hidden">
      <ParticlesBackground quantity={400} staticity={7} ease={50} />
      <div
        className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-transparent to-app/90 pointer-events-none z-0"
        aria-hidden="true"
      />

      <AuthCard
        title={viewTitles[viewState]}
        subtitle={
          viewState === "LOGIN"
            ? "Plataforma clínica y administrativa"
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
            autoFocus={shouldAutoFocusEmail}
            onSuccess={(email) => {
              setRecoveryEmail(email);
              setShouldAutoFocusEmail(false);
              setViewState("RECOVERY_OTP");
            }}
            onCancel={() => {
              setRecoveryEmail("");
              setShouldAutoFocusEmail(false);
              setViewState("LOGIN");
            }}
          />
        )}

        {viewState === "RECOVERY_OTP" && recoveryEmail && (
          <VerifyOtpForm
            email={recoveryEmail}
            onSuccess={() => {
              setViewState("RECOVERY_NEW_PASS");
            }}
            onBack={() => {
              setShouldAutoFocusEmail(true);
              setViewState("RECOVERY_REQUEST");
            }}
          />
        )}

        {viewState === "RECOVERY_OTP" && !recoveryEmail && (
          <RequestCodeForm
            autoFocus={shouldAutoFocusEmail}
            onSuccess={(email) => {
              setRecoveryEmail(email);
              setShouldAutoFocusEmail(false);
              setViewState("RECOVERY_OTP");
            }}
            onCancel={() => {
              setRecoveryEmail("");
              setShouldAutoFocusEmail(false);
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
