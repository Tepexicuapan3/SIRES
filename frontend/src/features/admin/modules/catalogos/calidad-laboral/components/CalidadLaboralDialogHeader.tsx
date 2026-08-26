import type { ReactNode } from "react";
import { Award } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface CalidadLaboralDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function CalidadLaboralDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: CalidadLaboralDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Award className="size-7" />}
    />
  );
}
