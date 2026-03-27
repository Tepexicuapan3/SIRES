import { useState } from "react";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { cn } from "@shared/utils/styling/cn";

export interface TableOptionItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onSelect?: () => void | Promise<unknown>;
  disabled?: boolean;
  isLoading?: boolean;
  loadingAnimation?: "spin" | "pulse";
}

export interface TableOptionsMenuProps {
  options: TableOptionItem[];
  label?: string;
}

export function TableOptionsMenu({
  options,
  label = "Opciones de tabla",
}: TableOptionsMenuProps) {
  const [transientLoading, setTransientLoading] = useState<
    Record<string, boolean>
  >({});

  if (options.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label={label}>
          <MoreVertical className="size-4 text-txt-muted" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {options.map((option) => {
          const Icon = option.icon;
          const isOptionLoading =
            option.isLoading || transientLoading[option.id];
          const isOptionDisabled = option.disabled || isOptionLoading;
          const loadingIconClass =
            option.loadingAnimation === "pulse"
              ? "animate-pulse"
              : "animate-spin [animation-direction:reverse]";

          return (
            <DropdownMenuItem
              key={option.id}
              disabled={isOptionDisabled}
              aria-busy={isOptionLoading || undefined}
              onSelect={(event) => {
                event.preventDefault();
                if (isOptionDisabled) {
                  return;
                }

                const minimumSpinMs = 650;
                const startedAt = Date.now();
                setTransientLoading((current) => ({
                  ...current,
                  [option.id]: true,
                }));

                void Promise.resolve(option.onSelect?.()).finally(() => {
                  const elapsedMs = Date.now() - startedAt;
                  const remainingMs = Math.max(minimumSpinMs - elapsedMs, 0);

                  window.setTimeout(() => {
                    setTransientLoading((current) => {
                      const next = { ...current };
                      delete next[option.id];
                      return next;
                    });
                  }, remainingMs);
                });
              }}
            >
              {Icon ? (
                <Icon
                  className={cn("size-4", isOptionLoading && loadingIconClass)}
                />
              ) : null}
              {option.label}
              {isOptionLoading ? (
                <span className="sr-only">{`${option.label} en progreso...`}</span>
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
