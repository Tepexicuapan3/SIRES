import type { ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface TipoConsultaDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function TipoConsultaDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: TipoConsultaDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<ClipboardList className="size-7" />}
    />
  );
}
