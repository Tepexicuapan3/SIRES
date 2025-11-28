import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  icon?: ReactNode;
  rightElement?: ReactNode;
  helperText?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      icon,
      rightElement,
      helperText,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    // Determinamos si hay error para cambiar colores dinámicamente
    const hasError = !!error;

    return (
      <div className="group space-y-2">
        {/* Label: Usamos font-body y colores semánticos */}
        <label
          htmlFor={id}
          className={cn(
            "block text-sm font-semibold transition-colors duration-200",
            hasError ? "text-status-critical" : "text-txt-body"
          )}
        >
          {label}
        </label>

        {/* Input Container */}
        <div className="relative">
          {/* Icono Izquierdo */}
          {icon && (
            <div
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200",
                hasError
                  ? "text-status-critical"
                  : "text-txt-muted group-focus-within:text-brand"
              )}
            >
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={id}
            className={cn(
              // Base Styles
              "w-full h-12 rounded-lg text-sm font-body transition-all duration-200",
              "bg-paper border outline-none",
              "placeholder:text-txt-hint",
              "disabled:cursor-not-allowed disabled:opacity-50",

              // Bordes y Colores (Normal vs Error)
              hasError
                ? "border-status-critical text-status-critical focus:ring-2 focus:ring-status-critical/20"
                : "border-line-struct text-txt-body focus:border-brand focus:ring-4 focus:ring-brand/10",

              // Padding dinámico según iconos
              icon ? "pl-11 pr-4" : "px-4",
              rightElement && "pr-12",

              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            {...props}
          />

          {/* Elemento Derecho (ej. Ojo contraseña) */}
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted">
              {rightElement}
            </div>
          )}
        </div>

        {/* Error Message */}
        {hasError && (
          <p
            id={`${id}-error`}
            className="flex items-center gap-1 text-xs font-medium text-status-critical animate-in slide-in-from-top-1 fade-in duration-200"
            role="alert"
          >
            {/* Pequeño círculo para enfatizar el error */}
            <span className="inline-block w-1 h-1 rounded-full bg-status-critical" />
            {error.message}
          </p>
        )}

        {/* Helper Text (solo si no hay error) */}
        {helperText && !hasError && (
          <p id={`${id}-helper`} className="text-xs text-txt-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
