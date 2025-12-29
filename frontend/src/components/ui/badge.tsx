import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-brand focus-visible:ring-brand/50 focus-visible:ring-[3px] aria-invalid:ring-status-critical/20 dark:aria-invalid:ring-status-critical/40 aria-invalid:border-status-critical transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand text-txt-inverse [a&]:hover:bg-brand-hover",
        secondary:
          "border-line-struct bg-subtle text-txt-body [a&]:hover:bg-subtle/80",
        critical:
          "border-transparent bg-status-critical/10 text-status-critical [a&]:hover:bg-status-critical/20 focus-visible:ring-status-critical/20 dark:focus-visible:ring-status-critical/40",
        alert:
          "border-transparent bg-status-alert/10 text-status-alert [a&]:hover:bg-status-alert/20 focus-visible:ring-status-alert/20 dark:focus-visible:ring-status-alert/40",
        stable:
          "border-transparent bg-status-stable/10 text-status-stable [a&]:hover:bg-status-stable/20 focus-visible:ring-status-stable/20 dark:focus-visible:ring-status-stable/40",
        info: "border-transparent bg-status-info/10 text-status-info [a&]:hover:bg-status-info/20 focus-visible:ring-status-info/20 dark:focus-visible:ring-status-info/40",
        outline:
          "border-line-struct text-txt-body [a&]:hover:bg-subtle [a&]:hover:text-txt-body",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
