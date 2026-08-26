import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface SucursalDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function SucursalDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: SucursalDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Building2 className="size-7" />}
    />
  );
}
