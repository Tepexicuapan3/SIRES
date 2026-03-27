import type { ComponentPropsWithRef } from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@shared/utils/styling/cn";

type ScrollAreaProps = ComponentPropsWithRef<
  typeof ScrollAreaPrimitive.Root
> & {
  scrollbarClassName?: string;
  thumbClassName?: string;
  viewportClassName?: string;
};

function ScrollArea({
  className,
  children,
  scrollbarClassName,
  thumbClassName,
  viewportClassName,
  ref,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      tabIndex={-1}
      className={cn(
        "relative overflow-hidden focus-visible:outline-none",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        tabIndex={-1}
        className={cn(
          "h-full w-full rounded-[inherit] focus-visible:outline-none",
          viewportClassName,
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar
        className={scrollbarClassName}
        thumbClassName={thumbClassName}
      />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

type ScrollBarProps = ComponentPropsWithRef<
  typeof ScrollAreaPrimitive.ScrollAreaScrollbar
> & {
  thumbClassName?: string;
};

function ScrollBar({
  className,
  orientation = "vertical",
  thumbClassName,
  ref,
  ...props
}: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      tabIndex={-1}
      className={cn(
        "flex touch-none select-none transition-colors focus-visible:outline-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent p-px",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent p-px",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        className={cn(
          "relative flex-1 rounded-full bg-line-struct hover:bg-txt-muted/50 transition-colors",
          thumbClassName,
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
