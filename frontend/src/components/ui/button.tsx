import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/buttonVariants";

/**
 * Button Component - Adaptado al Sistema Metro CDMX
 *
 * Usa tokens semánticos del sistema de diseño:
 * - bg-brand: Color institucional Metro (#fe5000)
 * - status-critical/alert/stable/info: Estados clínicos
 * - txt-body/muted/inverse: Jerarquía de texto
 *
 * Basado en shadcn/ui pero personalizado para SIRES.
 */

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
