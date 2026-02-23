import type { ComponentPropsWithRef, ReactNode } from "react";
import type { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface FormFieldProps extends ComponentPropsWithRef<"input"> {
  label: string;
  error?: FieldError;
  icon?: ReactNode;
  rightElement?: ReactNode;
  helperText?: string;
}

export function FormField({
  label,
  error,
  icon,
  rightElement,
  helperText,
  className = "",
  id,
  ref,
  ...props
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <div className="group space-y-2">
      <label
        htmlFor={id}
        className={cn(
          "block text-sm font-semibold transition-colors duration-200",
          hasError ? "text-status-critical" : "text-txt-body",
        )}
      >
        {label}
      </label>

      <div className="relative">
        {icon && (
          <div
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200",
              hasError
                ? "text-status-critical"
                : "text-txt-muted group-focus-within:text-brand",
            )}
          >
            {icon}
          </div>
        )}

        <Input
          ref={ref}
          id={id}
          className={cn(
            "h-12",
            hasError && "text-status-critical",
            icon ? "pl-11 pr-4" : "px-4",
            rightElement && "pr-12",
            className,
          )}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted">
            {rightElement}
          </div>
        )}
      </div>

      {hasError && (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1 text-xs font-medium text-status-critical animate-in slide-in-from-top-1 fade-in duration-200"
          role="alert"
        >
          <span className="inline-block w-1 h-1 rounded-full bg-status-critical" />
          {error.message}
        </p>
      )}

      {helperText && !hasError && (
        <p id={`${id}-helper`} className="text-xs text-txt-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}

FormField.displayName = "FormField";
