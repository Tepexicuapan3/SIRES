import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input Component - Adaptado al Sistema Metro CDMX
 *
 * Componente base de input usando tokens semánticos Metro.
 * Para formularios completos con label + error, usar <FormField>.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          // Base
          "h-10 w-full min-w-0 rounded-lg border px-3 py-2 text-sm font-body transition-all duration-200 outline-none",

          // Colores y estados (Metro tokens)
          "bg-paper border-line-struct text-txt-body",
          "placeholder:text-txt-hint",
          "selection:bg-brand/20 selection:text-txt-body",

          // Focus
          "focus:border-brand focus:ring-4 focus:ring-brand/10",

          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",

          // Error state (aria-invalid)
          "aria-invalid:border-status-critical aria-invalid:ring-2 aria-invalid:ring-status-critical/20",

          // File upload styling
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-txt-body",

          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
