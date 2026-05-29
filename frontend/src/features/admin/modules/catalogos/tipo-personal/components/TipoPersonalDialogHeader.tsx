import type { ReactNode } from "react";
import { Briefcase } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface TipoPersonalDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function TipoPersonalDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: TipoPersonalDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Briefcase className="size-7" />}
    />
  );
}
