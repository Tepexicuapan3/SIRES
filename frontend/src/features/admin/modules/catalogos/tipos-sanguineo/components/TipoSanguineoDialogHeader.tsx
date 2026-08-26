import type { ReactNode } from "react";
import { Droplet } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface TipoSanguineoDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function TipoSanguineoDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: TipoSanguineoDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Droplet className="size-7" />}
    />
  );
}
