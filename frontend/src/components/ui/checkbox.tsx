import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Checkbox Component - Adaptado al Sistema Metro CDMX
 *
 * Usa tokens semánticos:
 * - bg-brand: Estado checked
 * - status-critical: Estados de error
 * - line-struct: Bordes
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-line-struct shadow-xs transition-shadow outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-brand/50 focus-visible:border-brand",
        "data-[state=checked]:bg-brand data-[state=checked]:text-txt-inverse data-[state=checked]:border-brand",
        "aria-invalid:border-status-critical aria-invalid:ring-status-critical/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
