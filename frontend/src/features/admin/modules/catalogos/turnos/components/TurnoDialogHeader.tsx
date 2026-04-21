import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface TurnoDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function TurnoDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: TurnoDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Clock className="size-7" />}
    />
  );
}
