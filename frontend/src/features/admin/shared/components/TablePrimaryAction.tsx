import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { cn } from "@/lib/utils";

export interface TablePrimaryActionProps {
  permission: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TablePrimaryAction({
  permission,
  label,
  icon,
  onClick,
  className,
}: TablePrimaryActionProps) {
  return (
    <PermissionGate permission={permission}>
      <Button
        variant="default"
        size="sm"
        aria-label={label}
        onClick={onClick}
        className={cn("whitespace-nowrap", className)}
      >
        {icon}
        {label}
      </Button>
    </PermissionGate>
  );
}
