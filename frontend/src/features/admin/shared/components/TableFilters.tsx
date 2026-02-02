import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

const FILTER_ALIGN = {
  start: "justify-start",
  end: "justify-end",
  between: "justify-between",
} as const;

type FilterAlign = keyof typeof FILTER_ALIGN;

export interface TableFiltersProps {
  children: ReactNode;
  className?: string;
  align?: FilterAlign;
}

export function TableFilters({
  children,
  className,
  align = "end",
}: TableFiltersProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line-struct bg-subtle p-2",
        className,
      )}
    >
      <div
        className={cn("flex flex-wrap items-end gap-2", FILTER_ALIGN[align])}
      >
        {children}
      </div>
    </div>
  );
}
