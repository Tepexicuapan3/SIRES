import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/shared/PermissionGate";

export interface TablePrimaryActionProps {
  permission: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export function TablePrimaryAction({
  permission,
  label,
  icon,
  onClick,
}: TablePrimaryActionProps) {
  return (
    <PermissionGate permission={permission}>
      <Button variant="default" size="sm" aria-label={label} onClick={onClick}>
        {icon}
        {label}
      </Button>
    </PermissionGate>
  );
}
