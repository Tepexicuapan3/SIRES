import { MoreVertical, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ACTION_VARIANT = {
  DEFAULT: "default",
  DESTRUCTIVE: "destructive",
} as const;

type TableActionVariant = (typeof ACTION_VARIANT)[keyof typeof ACTION_VARIANT];

export interface TableActionItem {
  id: string;
  type?: "item";
  label: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  disabled?: boolean;
  variant?: TableActionVariant;
}

export interface TableActionSeparator {
  id: string;
  type: "separator";
}

export type TableAction = TableActionItem | TableActionSeparator;

const isSeparator = (action: TableAction): action is TableActionSeparator =>
  "type" in action && action.type === "separator";

export interface TableToolbarProps {
  actions: TableAction[];
  align?: "start" | "end";
  label?: string;
  className?: string;
}

export function TableToolbar({
  actions,
  align = "end",
  label = "Acciones",
  className,
}: TableToolbarProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className={cn("text-txt-muted", className)}
        >
          <MoreVertical className="size-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44">
        {actions.map((action) => {
          if (isSeparator(action)) {
            return <DropdownMenuSeparator key={action.id} />;
          }

          const Icon = action.icon;
          const isDestructive = action.variant === ACTION_VARIANT.DESTRUCTIVE;

          return (
            <DropdownMenuItem
              key={action.id}
              disabled={action.disabled}
              variant={isDestructive ? "destructive" : "default"}
              onSelect={(event) => {
                event.preventDefault();
                action.onSelect?.();
              }}
            >
              {Icon ? <Icon className="mr-2 size-4" /> : null}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TableActionsHeader() {
  return <span className="sr-only">Acciones</span>;
}
