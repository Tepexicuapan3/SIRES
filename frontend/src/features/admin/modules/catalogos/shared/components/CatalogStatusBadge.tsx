import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CatalogStatusBadgeProps {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}

export function CatalogStatusBadge({
  isActive,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
  className,
}: CatalogStatusBadgeProps) {
  return isActive ? (
    <Badge variant="stable" className={cn("gap-2", className)}>
      <span className="size-1.5 shrink-0 rounded-full bg-status-stable" />
      {activeLabel}
    </Badge>
  ) : (
    <Badge variant="secondary" className={cn("gap-2", className)}>
      <span className="size-1.5 shrink-0 rounded-full bg-txt-muted" />
      {inactiveLabel}
    </Badge>
  );
}
