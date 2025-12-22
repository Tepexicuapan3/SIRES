import { useState, useCallback } from "react";
import { ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/api/resources/auth.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OtpInput } from "@/components/ui/OtpInput";

interface Props {
  email: string;
  onSuccess: () => void; // Token now comes in HttpOnly cookie
  onBack: () => void;
}

const MAX_ATTEMPTS = 3;

export const VerifyOtpForm = ({ email, onSuccess, onBack }: Props) => {
  const [code, setCode] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [hasError, setHasError] = useState(false);

  const isBlocked = failedAttempts >= MAX_ATTEMPTS;
  const isCodeComplete = code.length === 6;

  const { mutate, isPending } = useMutation({
    mutationFn: (otpCode: string) =>
      authAPI.verifyResetCode({ email, code: otpCode }),
    onSuccess: (data) => {
      if (data.valid) {
        toast.success("Código verificado");
        onSuccess(); // Token already set in HttpOnly cookie by backend
      } else {
        handleVerificationError();
      }
    },
    onError: () => {
      handleVerificationError();
    },
  });

  const handleVerificationError = useCallback(() => {
    setHasError(true);
    setCode(""); // Limpiar el código

    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);

    if (newCount >= MAX_ATTEMPTS) {
      toast.error("Código invalidado", {
        description: "Has superado el número máximo de intentos.",
      });
    } else {
      toast.error("Código incorrecto", {
        description: `Te quedan ${MAX_ATTEMPTS - newCount} intento${
          MAX_ATTEMPTS - newCount !== 1 ? "s" : ""
        }.`,
      });
    }

    // Quitar estado de error después de un momento
    setTimeout(() => setHasError(false), 1500);
  }, [failedAttempts]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    // Limpiar error cuando el usuario empieza a escribir
    if (hasError) setHasError(false);
  };

  const handleComplete = useCallback(
    (completedCode: string) => {
      if (!isBlocked && !isPending) {
        mutate(completedCode);
      }
    },
    [isBlocked, isPending, mutate]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCodeComplete && !isBlocked && !isPending) {
      mutate(code);
    }
  };

  // Ofuscar el email para mostrar solo parte
  const obfuscatedEmail = email.replace(
    /(.{2})(.*)(@.*)/,
    (_, start, middle, end) =>
      `${start}${"•".repeat(Math.min(middle.length, 6))}${end}`
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      {/* Header con icono y mensaje */}
      <div className="mt-4 text-center space-y-2 mb-6">
        <div
          className={cn(
            "inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 transition-all duration-300",
            isBlocked
              ? "bg-status-critical/10 text-status-critical"
              : hasError
              ? "bg-status-alert/10 text-status-alert animate-pulse"
              : "bg-brand/10 text-brand"
          )}
        >
          {isBlocked ? (
            <AlertCircle size={32} strokeWidth={1.5} />
          ) : (
            <ShieldCheck size={32} strokeWidth={1.5} />
          )}
        </div>

        {isBlocked ? (
          <div className="space-y-1">
            <h3 className="font-bold text-status-critical text-lg">
              Código Invalidado
            </h3>
            <p className="text-sm text-txt-muted leading-relaxed max-w-xs mx-auto">
              Has superado los 3 intentos. Por seguridad, debes solicitar un
              nuevo código.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-txt-muted leading-relaxed">
              Ingresa el código de 6 dígitos enviado a
            </p>
            <p className="font-semibold text-txt-body">{obfuscatedEmail}</p>
          </div>
        )}
      </div>

      {/* OTP Input */}
      <div className="pt-2">
        <OtpInput
          length={6}
          value={code}
          onChange={handleCodeChange}
          onComplete={handleComplete}
          disabled={isPending || isBlocked}
          hasError={hasError}
          autoFocus={!isBlocked}
        />

        {/* Indicador sutil de estado */}
        {!isBlocked && (
          <div className="h-8 mt-4 flex items-center justify-center">
            {isPending ? (
              <span className="flex items-center gap-2 text-brand font-medium text-sm">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Verificando...
              </span>
            ) : (
              <p className="text-xs text-txt-hint">
                El código expira en 10 minutos
              </p>
            )}
          </div>
        )}
      </div>

      {/* Botón de acción */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className={cn(
            "w-full h-12 font-medium flex items-center justify-center gap-2 transition-all duration-200 rounded-lg",
            isBlocked
              ? "bg-brand text-white hover:bg-brand-hover shadow-md"
              : "text-txt-muted hover:text-txt-body hover:bg-subtle"
          )}
        >
          {isBlocked ? (
            <>
              Solicitar nuevo código
              <ArrowLeft size={16} className="rotate-180" />
            </>
          ) : (
            <>
              <ArrowLeft size={16} />
              Cambiar correo
            </>
          )}
        </button>
      </div>

      {/* Texto de ayuda */}
      {!isBlocked && (
        <p className="text-xs text-center text-txt-hint">
          ¿No recibiste el código?{" "}
          <button
            type="button"
            onClick={onBack}
            className="text-brand hover:underline font-medium"
            disabled={isPending}
          >
            Reenviar
          </button>
        </p>
      )}
    </form>
  );
};
