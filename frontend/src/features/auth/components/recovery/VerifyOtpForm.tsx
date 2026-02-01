import { useState, type FormEvent } from "react";
import {
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/api/resources/auth.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/button";
import { ApiError, ERROR_CODES } from "@/api/utils/errors";
import {
  getAuthErrorMessage,
  recoveryErrorMessages,
} from "@features/auth/domain/auth.messages";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  obfuscateEmail,
} from "@features/auth/domain/auth.rules";

interface Props {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

/** UX: bloqueo local de intentos, el control real es backend. */
export const VerifyOtpForm = ({ email, onSuccess, onBack }: Props) => {
  const expiredCode = ERROR_CODES.CODE_EXPIRED;
  const [code, setCode] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [hasError, setHasError] = useState(false);

  const isBlocked = failedAttempts >= OTP_MAX_ATTEMPTS;
  const isCodeComplete = code.length === OTP_LENGTH;

  const { mutate, isPending } = useMutation({
    mutationFn: (otpCode: string) =>
      authAPI.verifyResetCode({ email, code: otpCode }),
    onSuccess: (data) => {
      if (data.valid) {
        toast.success("Código verificado");
        onSuccess();
      } else {
        handleVerificationError();
      }
    },
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;
      const errorMessage =
        getAuthErrorMessage(recoveryErrorMessages, errorCode) || error.message;

      if (errorCode === expiredCode) {
        toast.error("Código expirado", {
          description:
            errorMessage || "Solicita un nuevo código para continuar.",
        });
        onBack();
        return;
      }

      if (errorCode === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
        setHasError(true);
        setFailedAttempts(OTP_MAX_ATTEMPTS);
        toast.error("Codigo invalidado", {
          description:
            errorMessage || "Has superado el numero maximo de intentos.",
        });
        return;
      }

      handleVerificationError(errorMessage);
    },
  });

  const handleVerificationError = (message?: string) => {
    setHasError(true);
    setCode(""); // Limpiar el código

    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);

    if (newCount >= OTP_MAX_ATTEMPTS) {
      toast.error("Código invalidado", {
        description: message || "Has superado el número máximo de intentos.",
      });
    } else {
      toast.error("Código incorrecto", {
        description:
          message ||
          `Te quedan ${OTP_MAX_ATTEMPTS - newCount} intento${
            OTP_MAX_ATTEMPTS - newCount !== 1 ? "s" : ""
          }.`,
      });
    }

    // Quitar estado de error después de un momento
    setTimeout(() => setHasError(false), 1500);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    // Limpiar error cuando el usuario empieza a escribir
    if (hasError) setHasError(false);
  };

  const handleComplete = (completedCode: string) => {
    if (!isBlocked && !isPending) {
      mutate(completedCode);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isCodeComplete && !isBlocked && !isPending) {
      mutate(code);
    }
  };

  // Ofuscar el email para mostrar solo parte
  const obfuscatedEmail = obfuscateEmail(email);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      <div className="mt-4 text-center space-y-2 mb-6">
        <div
          className={cn(
            "inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 transition-all duration-300",
            isBlocked
              ? "bg-status-critical/10 text-status-critical"
              : hasError
                ? "bg-status-alert/10 text-status-alert animate-pulse"
                : "bg-brand/10 text-brand",
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
              Has superado los {OTP_MAX_ATTEMPTS} intentos. Por seguridad, debes
              solicitar un nuevo código.
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

      <div className="pt-2">
        <OtpInput
          length={OTP_LENGTH}
          value={code}
          onChange={handleCodeChange}
          onComplete={handleComplete}
          disabled={isPending || isBlocked}
          hasError={hasError}
          autoFocus={!isBlocked}
        />

        {!isBlocked && (
          <div className="h-8 mt-4 flex items-center justify-center">
            {isPending ? (
              <Loader2 className="size-5 animate-spin text-brand" />
            ) : (
              <p className="text-xs text-txt-hint">
                El código expira en 10 minutos
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className={cn(
            "w-full h-12 group",
            isBlocked
              ? "bg-brand text-white hover:bg-brand-hover shadow-md"
              : "text-txt-muted hover:text-txt-body hover:bg-subtle",
          )}
          variant={isBlocked ? "default" : "ghost"}
        >
          {isBlocked ? (
            <>
              Solicitar nuevo código
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </>
          ) : (
            <>
              <ArrowLeft
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Cambiar correo
            </>
          )}
        </Button>
      </div>

      {!isBlocked && (
        <p className="text-xs text-center text-txt-hint">
          ¿No recibiste el código?{" "}
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onBack}
            disabled={isPending}
            className="px-0 h-auto text-xs"
          >
            Reenviar
          </Button>
        </p>
      )}
    </form>
  );
};
