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
    return (
      <div className="space-y-2">
        {/* Label */}
        <label
          htmlFor={id}
          className="text-sm font-semibold text-foreground block"
        >
          {label}
        </label>

        {/* Input Container */}
        <div className="relative group">
          {/* Icono Izquierdo */}
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={id}
            className={cn(
              "input-metro",
              icon && "pl-12",
              rightElement && "pr-12",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            {...props}
          />

          {/* Elemento Derecho (ej: mostrar/ocultar contraseña) */}
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>

        {/* Helper Text o Error */}
        {error ? (
          <p
            id={`${id}-error`}
            className="text-xs text-destructive font-medium flex items-center gap-1.5 mt-2"
            role="alert"
          >
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error.message}
          </p>
        ) : helperText ? (
          <p id={`${id}-helper`} className="text-xs text-muted-foreground mt-2">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = "FormField";
