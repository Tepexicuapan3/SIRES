import type { ReactNode } from "react";
import { Compass } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface OrigenConsultaDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function OrigenConsultaDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: OrigenConsultaDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Compass className="size-7" />}
    />
  );
}
