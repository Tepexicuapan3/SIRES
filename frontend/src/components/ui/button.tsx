import type { ComponentPropsWithRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button.variants";

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

type ButtonProps = ComponentPropsWithRef<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

type ButtonSlotProps = ComponentPropsWithRef<"button">;

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...(props as ButtonSlotProps)}
    />
  );
}

Button.displayName = "Button";

export { Button };
