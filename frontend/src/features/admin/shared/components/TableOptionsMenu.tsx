import { MoreVertical, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TableOptionItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  disabled?: boolean;
}

export interface TableOptionsMenuProps {
  options: TableOptionItem[];
  label?: string;
}

export function TableOptionsMenu({
  options,
  label = "Opciones de tabla",
}: TableOptionsMenuProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-9 p-0">
          <MoreVertical className="size-4 text-txt-muted" />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {options.map((option) => {
          const Icon = option.icon;

          return (
            <DropdownMenuItem
              key={option.id}
              disabled={option.disabled}
              onSelect={(event) => {
                event.preventDefault();
                option.onSelect?.();
              }}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
