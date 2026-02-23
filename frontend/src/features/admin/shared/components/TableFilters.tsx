import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

const FILTER_ALIGN = {
  start: "sm:justify-start",
  end: "sm:justify-end",
  between: "sm:justify-between",
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
        "rounded-xl border border-line-struct bg-paper p-3 shadow-soft",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col gap-3 sm:flex-row sm:items-center",
          FILTER_ALIGN[align],
        )}
      >
        {children}
      </div>
    </div>
  );
}
