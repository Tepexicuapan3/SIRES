import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles - adaptado a Metro CDMX
        "flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Tokens Metro CDMX
        "border-line-struct text-txt-body placeholder:text-txt-hint",
        // Focus state
        "focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20",
        // Error state
        "aria-invalid:border-status-critical aria-invalid:ring-status-critical/20",
        // Dark mode (si se implementa)
        "dark:bg-bg-subtle",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
