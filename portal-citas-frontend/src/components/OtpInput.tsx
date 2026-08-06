import type { ClipboardEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

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
 * Input de código OTP con cajas individuales separadas por un guión —
 * mismo formato que `frontend/src/shared/ui/OtpInput.tsx` (recuperación de
 * contraseña en SISEM), portado sin `cn`/tailwind-merge para no traer esas
 * dependencias solo por esto.
 */
export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const digits = value.split("").slice(0, length);
  while (digits.length < length) {
    digits.push("");
  }

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  const focusInput = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[clampedIndex]?.focus();
  };

  const handleChange = (index: number, inputValue: string) => {
    const digit = inputValue.replace(/\D/g, "").slice(-1);
    if (!digit && inputValue !== "") return;

    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(""));

    if (digit && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Backspace":
        e.preventDefault();
        if (digits[index]) {
          const newDigits = [...digits];
          newDigits[index] = "";
          onChange(newDigits.join(""));
        } else if (index > 0) {
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

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      focusInput(Math.min(pastedData.length, length - 1));
    }
  };

  const separatorIndex = Math.floor(length / 2);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => {
        const boxClasses = [
          "h-12 w-10 sm:h-14 sm:w-12 rounded-lg border-2 text-center font-mono text-xl font-bold outline-none transition-all duration-200 sm:text-2xl bg-paper",
          disabled ? "cursor-not-allowed opacity-50 bg-subtle" : "",
          hasError && !disabled
            ? "border-status-critical text-status-critical bg-status-critical/5 animate-pulse"
            : "",
          !hasError && !disabled
            ? digit
              ? "border-brand/50 text-txt-body"
              : "border-line-struct text-txt-body"
            : "",
          !hasError && !disabled && focusedIndex === index
            ? "border-brand ring-4 ring-brand/10"
            : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
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
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              disabled={disabled}
              aria-label={`Dígito ${index + 1} de ${length}`}
              placeholder="•"
              className={boxClasses}
            />

            {index === separatorIndex - 1 && (
              <div
                className={`h-0.5 w-3 rounded-full transition-colors duration-200 sm:w-4 ${
                  hasError ? "bg-status-critical/50" : disabled ? "bg-line-struct/50" : "bg-line-struct"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
