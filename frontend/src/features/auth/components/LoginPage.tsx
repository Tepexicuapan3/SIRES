import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RequestCodeForm } from "./recovery/RequestCodeForm";
import { VerifyOtpForm } from "./recovery/VerifyOtpForm";
import { AuthPasswordForm, PasswordFormData } from "./AuthPasswordForm";
import { ParticlesBackground } from "../animations/ParticlesBackground";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/api/resources/auth.api";
import { toast } from "sonner";
import { useLoginProtectionStore } from "@/store/loginProtectionStore";

export type AuthViewState =
  | "LOGIN"
  | "RECOVERY_REQUEST"
  | "RECOVERY_OTP"
  | "RECOVERY_NEW_PASS";

// Tipo extendido para incluir el token en el submit
interface ResetPasswordData extends PasswordFormData {
  resetToken: string;
}

export const LoginPage = () => {
  const [viewState, setViewState] = useState<AuthViewState>("LOGIN");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const { resetProtection } = useLoginProtectionStore();

  // Mutacion para RECOVERY - Ahora recibe el token como parámetro
  const { mutate: resetPassword, isPending: isResetting } = useMutation({
    mutationFn: (data: ResetPasswordData) =>
      authAPI.resetPassword({
        reset_token: data.resetToken, // Usamos el token que viene como argumento
        new_password: data.newPassword,
      }),
    onSuccess: () => {
      resetProtection();
      toast.success("¡Contraseña actualizada!", {
        description: "Ya puedes iniciar sesión con tu nueva clave.",
      });
      setViewState("LOGIN");
    },
    onError: () => {
      toast.error("Error al restablecer", {
        description: "El token ha expirado, por favor solicita uno nuevo.",
      });
      setViewState("RECOVERY_REQUEST");
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
      <div className="w-full max-w-[440px] z-10 animate-fade-in-up">
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
                onSuccess={(token) => {
                  setResetToken(token);
                  setViewState("RECOVERY_NEW_PASS");
                }}
                onBack={() => setViewState("RECOVERY_REQUEST")}
              />
            )}

            {viewState === "RECOVERY_NEW_PASS" && (
              <AuthPasswordForm
                mode="recovery"
                isPending={isResetting}
                onSubmit={(data) => resetPassword({ ...data, resetToken })}
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
