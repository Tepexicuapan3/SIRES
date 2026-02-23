import type { ComponentPropsWithRef } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

/**
 * Label Component - Adaptado al Sistema Metro CDMX
 *
 * Usa Radix UI Label primitive con tokens Metro.
 * Asocia automáticamente con inputs para accesibilidad.
 */
function Label({
  className,
  ref,
  ...props
}: ComponentPropsWithRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm font-semibold text-txt-body leading-none select-none transition-colors duration-200",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
