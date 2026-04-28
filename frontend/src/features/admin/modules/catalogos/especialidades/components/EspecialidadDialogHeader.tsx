import type { ReactNode } from "react";
import { Stethoscope } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface EspecialidadDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function EspecialidadDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: EspecialidadDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Stethoscope className="size-7" />}
    />
  );
}
