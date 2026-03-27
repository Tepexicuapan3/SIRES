import { type ReactNode } from "react";
import { Button } from "@shared/ui/button";
import { PermissionGate } from "@shared/components/PermissionGate";
import { cn } from "@shared/utils/styling/cn";

export interface TablePrimaryActionProps {
  permission: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  dependencyAware?: boolean;
  className?: string;
}

export function TablePrimaryAction({
  permission,
  label,
  icon,
  onClick,
  dependencyAware = false,
  className,
}: TablePrimaryActionProps) {
  return (
    <PermissionGate permission={permission} dependencyAware={dependencyAware}>
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
