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
import { recoveryErrorMessages } from "../utils/errorMessages";
import { cn } from "@/lib/utils";

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

  /**
   * Mutation: Restablecer contraseña (último paso del flujo de recovery)
   *
   * FLUJO COMPLETO:
   * 1. RequestCodeForm → Solicita OTP por email
   * 2. VerifyOtpForm → Valida OTP y setea reset_token en cookie HttpOnly
   * 3. Esta mutation → Usa reset_token de cookie para cambiar la contraseña
   *
   * SEGURIDAD: El token NO se envía desde frontend, el backend lo lee de la cookie.
   * @see backend/src/use_cases/auth/reset_password_usecase.py
   */
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

      // Usar mensajes centralizados
      const message = errorCode
        ? recoveryErrorMessages[errorCode] ||
          "Error al restablecer la contraseña"
        : "El token ha expirado, solicita uno nuevo";

      toast.error("Error al restablecer", { description: message });

      // Si el token expiró o es inválido, volver al inicio del flujo
      // Códigos que indican token inválido/expirado:
      // - INVALID_SCOPE: Token con scope incorrecto
      // - TOKEN_EXPIRED: Token expiró
      // - INVALID_TOKEN: Token malformado
      // - UNAUTHORIZED: Token no encontrado
      const tokenErrors = [
        "INVALID_SCOPE",
        "TOKEN_EXPIRED",
        "INVALID_TOKEN",
        "UNAUTHORIZED",
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
        staticity={7} // Movimiento lento y estable (Clínico)
        ease={50} // Suavidad alta
      />
      {/* Gradiente radial sutil para dar profundidad sin afectar legibilidad */}
      <div
        className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-transparent to-app/90 pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* === TARJETA DE LOGIN === */}
      <div className="w-full max-w-md z-10 animate-fade-in-up">
        {/* 
          Card Container (Glassmorphism profesional)
          
          DECISIONES DE DISEÑO:
          - bg-paper/85 (light) + dark:bg-paper/75 (dark): Opacidad alta (85%/75%) para garantizar
            legibilidad y consistencia cross-browser. Evita el "efecto acuoso" de opacidades bajas.
          
          - backdrop-blur-md: Blur moderado (en vez de xl) que es más consistente entre Chrome/Firefox.
            Los motores de blur webkit (Chrome) y gecko (Firefox) renderizan diferente los valores extremos.
          
          - border-line-struct: Token semántico Metro CDMX para bordes estructurales.
            Usamos border-white/20 en dark mode porque border-line-struct (slate-500)
            no tiene suficiente contraste sobre bg-paper-dark.
          
          - shadow-2xl + shadow-brand/5: Sombra con tinte naranja Metro (#fe5000).
            Utiliza el token --color-brand definido en theme.css con opacidad del 5%.
            En dark mode usa shadow-black/20 para mejor contraste.
        */}
        <div className="relative rounded-3xl p-8 sm:p-10 overflow-hidden bg-paper/85 dark:bg-paper/75 border border-line-struct dark:border-white/20 backdrop-blur-md shadow-2xl shadow-brand/5 dark:shadow-black/20 transition-all duration-300">
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

            {/* Progress Indicator (solo en recovery flow) */}
            {viewState !== "LOGIN" && (
              <div
                className="flex items-center gap-3 mb-4"
                role="progressbar"
                aria-label="Progreso de recuperación"
              >
                {["RECOVERY_REQUEST", "RECOVERY_OTP", "RECOVERY_NEW_PASS"].map(
                  (step, idx) => {
                    const currentIndex = [
                      "RECOVERY_REQUEST",
                      "RECOVERY_OTP",
                      "RECOVERY_NEW_PASS",
                    ].indexOf(viewState);
                    const isActive = viewState === step;
                    const isCompleted = currentIndex > idx;

                    return (
                      <div
                        key={step}
                        className={cn(
                          "h-2 w-2 rounded-full transition-all duration-300",
                          isActive &&
                            "bg-brand scale-125 shadow-lg shadow-brand/50",
                          isCompleted && "bg-brand/40",
                          !isActive && !isCompleted && "bg-line-struct",
                        )}
                        aria-label={`Paso ${idx + 1} de 3${isActive ? " (actual)" : ""}${isCompleted ? " (completado)" : ""}`}
                      />
                    );
                  },
                )}
              </div>
            )}

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
        <p className="mt-8 text-center text-xs text-txt-muted/70 max-w-xs mx-auto">
          <span className="block sm:inline">
            © {new Date().getFullYear()} Sistema de Transporte Colectivo.
          </span>{" "}
          <span className="block sm:inline">
            Uso exclusivo personal autorizado.
          </span>
        </p>
      </div>
    </main>
  );
};
