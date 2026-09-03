import type { ReactNode } from "react";
import { Home } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface TipoResidenciaDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function TipoResidenciaDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: TipoResidenciaDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Home className="size-7" />}
    />
  );
}
