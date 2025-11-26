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
          className="text-sm font-semibold text-foreground block font-sans"
        >
          {label}
        </label>

        {/* Input Container */}
        <div className="relative group">
          {/* Icono Izquierdo */}
          {icon && (
            <div
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none",
                error
                  ? "text-primary"
                  : "text-muted-foreground group-focus-within:text-primary"
              )}
            >
              {icon}
            </div>
          )}

          {/* Input con estilo Apple */}
          <input
            ref={ref}
            id={id}
            className={cn(
              // Base
              "w-full h-12 rounded-2xl px-4 text-base font-sans",
              "bg-background/50 backdrop-blur-sm",
              "border-2 transition-all duration-200",
              "placeholder:text-muted-foreground/60",
              "disabled:cursor-not-allowed disabled:opacity-50",

              // Estados normales
              !error && "border-border",
              !error &&
                "focus:border-primary focus:ring-4 focus:ring-primary/10",

              // Estados de error
              error && "border-primary",
              error &&
                "focus:border-primary focus:ring-4 focus:ring-primary/20",

              // Padding con iconos
              icon && "pl-12",
              rightElement && "pr-12",

              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            {...props}
          />

          {/* Elemento Derecho */}
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
            className="text-xs text-primary font-medium flex items-center gap-1.5 mt-2 font-sans"
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
          <p
            id={`${id}-helper`}
            className="text-xs text-muted-foreground mt-2 font-sans"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = "FormField";
