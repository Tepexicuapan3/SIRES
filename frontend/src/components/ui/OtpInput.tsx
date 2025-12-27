import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

/**
 * OTP Input Component
 *
 * Input de código OTP con cajas individuales separadas por un guión.
 * Soporta: auto-focus, navegación con teclado, paste, auto-submit.
 */
export const OtpInput = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: OtpInputProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Convertir el valor string a array de dígitos
  const digits = value.split("").slice(0, length);
  while (digits.length < length) {
    digits.push("");
  }

  // Focus en el primer input al montar
  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  // Callback cuando se completa el código
  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const focusInput = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, length - 1));
      inputRefs.current[clampedIndex]?.focus();
    },
    [length],
  );

  const handleChange = (index: number, inputValue: string) => {
    // Solo permitir dígitos
    const digit = inputValue.replace(/\D/g, "").slice(-1);

    if (!digit && inputValue !== "") return;

    // Construir nuevo valor
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join("");

    onChange(newValue);

    // Mover al siguiente input si se ingresó un dígito
    if (digit && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    switch (e.key) {
      case "Backspace":
        e.preventDefault();
        if (digits[index]) {
          // Si hay dígito, borrarlo
          const newDigits = [...digits];
          newDigits[index] = "";
          onChange(newDigits.join(""));
        } else if (index > 0) {
          // Si está vacío, ir al anterior y borrarlo
          const newDigits = [...digits];
          newDigits[index - 1] = "";
          onChange(newDigits.join(""));
          focusInput(index - 1);
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (index > 0) focusInput(index - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (index < length - 1) focusInput(index + 1);
        break;
      case "Delete": {
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
        break;
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (pastedData) {
      onChange(pastedData);
      // Focus en el último dígito pegado o en el siguiente vacío
      const nextIndex = Math.min(pastedData.length, length - 1);
      focusInput(nextIndex);
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    // Seleccionar el contenido al hacer focus
    inputRefs.current[index]?.select();
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  // Calcular el índice del separador (mitad)
  const separatorIndex = Math.floor(length / 2);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <div key={index} className="flex items-center gap-2 sm:gap-3">
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            disabled={disabled}
            aria-label={`Dígito ${index + 1} de ${length}`}
            className={cn(
              // Base styles
              "w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono",
              "rounded-lg border-2 outline-none transition-all duration-200",
              "bg-paper",

              // Estados
              disabled && "opacity-50 cursor-not-allowed bg-subtle",

              // Error state
              hasError &&
                !disabled && [
                  "border-status-critical",
                  "text-status-critical",
                  "bg-status-critical/5",
                  "animate-pulse",
                ],

              // Normal state (sin error)
              !hasError &&
                !disabled && [
                  // Con valor
                  digit && "border-brand/50 text-txt-body",
                  // Sin valor
                  !digit && "border-line-struct text-txt-body",
                  // Focus
                  focusedIndex === index && "border-brand ring-4 ring-brand/10",
                ],

              // Placeholder styling
              "placeholder:text-txt-hint/20",
            )}
            placeholder="•"
          />

          {/* Separador central (guión) */}
          {index === separatorIndex - 1 && (
            <div
              className={cn(
                "w-3 sm:w-4 h-0.5 rounded-full transition-colors duration-200",
                hasError
                  ? "bg-status-critical/50"
                  : disabled
                    ? "bg-line-struct/50"
                    : "bg-line-struct",
              )}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
};
