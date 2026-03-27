import type { ComponentPropsWithRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@shared/utils/styling/cn";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default:
          "bg-paper text-txt-body border-line-struct [&>svg]:text-txt-muted",
        destructive:
          "bg-status-critical/10 text-status-critical border-status-critical/40 [&>svg]:text-status-critical",
        critical:
          "bg-status-critical/10 text-status-critical border-status-critical/40 [&>svg]:text-status-critical",
        warning:
          "bg-status-alert/10 text-status-alert border-status-alert/40 [&>svg]:text-status-alert",
        success:
          "bg-status-stable/10 text-status-stable border-status-stable/40 [&>svg]:text-status-stable",
        info: "bg-status-info/10 text-status-info border-status-info/40 [&>svg]:text-status-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type AlertProps = ComponentPropsWithRef<"div"> &
  VariantProps<typeof alertVariants>;

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}
Alert.displayName = "Alert";

type AlertTitleProps = ComponentPropsWithRef<"h5">;

function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <h5
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}
AlertTitle.displayName = "AlertTitle";

type AlertDescriptionProps = ComponentPropsWithRef<"div">;

function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
