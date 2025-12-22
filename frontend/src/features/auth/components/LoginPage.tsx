import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "./LoginForm";
import { RequestCodeForm } from "./recovery/RequestCodeForm";
import { VerifyOtpForm } from "./recovery/VerifyOtpForm";
import { AuthPasswordForm, PasswordFormData } from "./AuthPasswordForm";
import { ParticlesBackground } from "../animations/ParticlesBackground";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/api/resources/auth.api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import type { ResetPasswordResponse } from "@/api/types/auth.types";

export type AuthViewState =
  | "LOGIN"
  | "RECOVERY_REQUEST"
  | "RECOVERY_OTP"
  | "RECOVERY_NEW_PASS";

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [viewState, setViewState] = useState<AuthViewState>("LOGIN");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  // Mutacion para RECOVERY
  // El token de reset está en HttpOnly cookie (seteado por verify-reset-code)
  const { mutate: resetPassword, isPending: isResetting } = useMutation({
    mutationFn: (data: PasswordFormData) =>
      authAPI.resetPassword({
        new_password: data.newPassword,
      }),
    onSuccess: (response: ResetPasswordResponse) => {
      // Guardar datos del usuario en el store
      // Los tokens ya están en HttpOnly cookies (seteados por el backend)
      setAuth(response.user);
      
      // ✅ VERIFICAR SI REQUIERE ONBOARDING (aceptar T&C)
      // Si el usuario nunca aceptó los términos, DEBE hacerlo antes de acceder al dashboard
      if (response.requires_onboarding) {
        toast.info("Configuración inicial requerida", {
          description: "Por favor acepta los términos para continuar.",
        });
        navigate("/onboarding", { replace: true });
        return;
      }
      
      toast.success("¡Contraseña actualizada!", {
        description: "Bienvenido de vuelta.",
      });
      
      // Redirigir al dashboard solo si NO requiere onboarding
      navigate("/dashboard", { replace: true });
    },
    onError: (error: Error & { response?: { data?: { code?: string } } }) => {
      const errorCode = error.response?.data?.code;
      
      // Mapeo de errores específicos
      const errorMessages: Record<string, string> = {
        PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
        PASSWORD_NO_UPPERCASE: "Incluye al menos una letra mayúscula.",
        PASSWORD_NO_NUMBER: "Incluye al menos un número.",
        PASSWORD_NO_SPECIAL: "Incluye al menos un carácter especial (@, #, $).",
        INVALID_SCOPE: "El enlace ha expirado. Solicita uno nuevo.",
        USER_NOT_FOUND: "Usuario no encontrado.",
      };
      
      const message = errorCode 
        ? errorMessages[errorCode] || "Error al restablecer la contraseña."
        : "El token ha expirado, solicita uno nuevo.";
      
      toast.error("Error al restablecer", { description: message });
      
      // Si el token expiró, volver al inicio del flujo
      if (errorCode === "INVALID_SCOPE") {
        setViewState("RECOVERY_REQUEST");
      }
    },
  });

  return (
    <main className="relative min-h-screen w-full bg-app flex items-center justify-center p-4 overflow-hidden">
      {/* === BACKGROUND ANIMADO === */}
      <ParticlesBackground
        quantity={400} // Cantidad justa para no saturar
        staticity={7} // Movimiento lento y estable (Clínico)
        ease={50} // Suavidad alta
      />
      <div className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-transparent to-app/80 pointer-events-none z-0" />

      {/* === TARJETA DE LOGIN === */}
      <div className="w-full max-w-md z-10 animate-fade-in-up">
        {/* Card Container */}
        <div className="relative rounded-3xl p-8 sm:p-10 overflow-hidden bg-paper/60 dark:bg-paper/40 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-2xl shadow-black/10 transition-all duration-300">
          {/* Header de Identidad */}
          <div className="flex flex-col items-center text-center">
            {/* Logo Wrapper */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center shadow-xl shadow-brand/20 mb-4 sm:mb-6 transition-all duration-300 hover:scale-105 hover:rotate-2">
              <img
                src="/SIRES.webp"
                alt="Logo SIRES"
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
              />
            </div>

            {/* Títulos dinámicos según el paso */}
            {viewState === "LOGIN" ? (
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-txt-body tracking-tight">
                S I R E S
              </h1>
            ) : (
              <h1 className="font-display text-xl sm:text-2xl md:text-2xl mt-2 font-bold text-txt-body tracking-tight mx-2">
                {viewState === "RECOVERY_REQUEST" &&
                  "¿Olvidaste tu contraseña?"}
                {viewState === "RECOVERY_OTP" && "Verifica tu identidad"}
                {viewState === "RECOVERY_NEW_PASS" && "Restablecer contraseña"}
              </h1>
            )}
          </div>

          {/* Renderizado Condicional de Formularios */}
          <div className="relative z-10">
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
                onCancel={() => setViewState("LOGIN")}
              />
            )}

            {viewState === "RECOVERY_OTP" && (
              <VerifyOtpForm
                email={recoveryEmail}
                onSuccess={() => {
                  // El token de reset se setea en cookie por el backend
                  setViewState("RECOVERY_NEW_PASS");
                }}
                onBack={() => setViewState("RECOVERY_REQUEST")}
              />
            )}

            {viewState === "RECOVERY_NEW_PASS" && (
              <AuthPasswordForm
                mode="recovery"
                isPending={isResetting}
                onSubmit={(data) => resetPassword(data)}
              />
            )}
          </div>
        </div>

        {/* Footer Externo */}
        <p className="mt-8 text-center text-xs text-txt-muted/70">
          © {new Date().getFullYear()} Sistema de Transporte Colectivo.{" "}
          <br className="sm:hidden" />
          Uso exclusivo personal autorizado.
        </p>
      </div>
    </main>
  );
};
