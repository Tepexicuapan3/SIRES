import type { ComponentPropsWithRef } from "react";

import { cn } from "@shared/utils/styling/cn";

/**
 * Input Component - Adaptado al Sistema Metro CDMX
 *
 * Componente base de input usando tokens semánticos Metro.
 * Para formularios completos con label + error, usar <FormField>.
 */
function Input({
  className,
  type,
  ref,
  ...props
}: ComponentPropsWithRef<"input">) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-2xl border px-3 py-2 text-sm font-body transition-all duration-200 outline-none",
        "bg-paper border-line-struct text-txt-body",
        "placeholder:text-txt-hint",
        "selection:bg-brand/20 selection:text-txt-body",
        "focus:border-brand focus:ring-4 focus:ring-brand/10",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
        "aria-invalid:border-status-critical aria-invalid:ring-2 aria-invalid:ring-status-critical/20",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-txt-body",
        className,
      )}
      {...props}
    />
  );
}

Input.displayName = "Input";

export { Input };
