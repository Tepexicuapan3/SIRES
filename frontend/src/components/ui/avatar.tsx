import type { ComponentPropsWithRef } from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

type AvatarProps = ComponentPropsWithRef<typeof AvatarPrimitive.Root>;

function Avatar({ className, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}
Avatar.displayName = AvatarPrimitive.Root.displayName;

type AvatarImageProps = ComponentPropsWithRef<typeof AvatarPrimitive.Image>;

function AvatarImage({ className, ...props }: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
}
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

type AvatarFallbackProps = ComponentPropsWithRef<
  typeof AvatarPrimitive.Fallback
>;

function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-subtle",
        className,
      )}
      {...props}
    />
  );
}
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

type AvatarBadgeProps = ComponentPropsWithRef<"span">;

function AvatarBadge({ className, ...props }: AvatarBadgeProps) {
  return (
    <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-paper",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge };
