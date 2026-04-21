import type { ReactNode } from "react";
import { School } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface EscuelaDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function EscuelaDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: EscuelaDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<School className="size-7" />}
    />
  );
}
