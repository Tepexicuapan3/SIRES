import type { KeyboardEventHandler, ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PermissionSearchFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onClear?: () => void;
  placeholder?: string;
  ariaLabel: string;
  disabled?: boolean;
  isExpanded?: boolean;
  controlsId?: string;
  activeDescendantId?: string;
  className?: string;
  inputClassName?: string;
  children?: ReactNode;
}

export function PermissionSearchField({
  value,
  onValueChange,
  onKeyDown,
  onClear,
  placeholder,
  ariaLabel,
  disabled = false,
  isExpanded = false,
  controlsId,
  activeDescendantId,
  className,
  inputClassName,
  children,
}: PermissionSearchFieldProps) {
  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }

    onValueChange("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-txt-muted" />
      <Input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? controlsId : undefined}
        aria-activedescendant={isExpanded ? activeDescendantId : undefined}
        className={cn(
          "pr-9 pl-9 focus:border-line-struct focus:ring-0 focus-visible:ring-2 focus-visible:ring-line-struct focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          inputClassName,
        )}
      />

      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1.5 size-7 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Limpiar busqueda"
        >
          <X className="size-4" />
        </Button>
      ) : null}

      {children}
    </div>
  );
}
