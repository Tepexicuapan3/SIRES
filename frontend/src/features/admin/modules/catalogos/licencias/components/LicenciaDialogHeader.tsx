import type { ReactNode } from "react";
import { FileBadge } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface LicenciaDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function LicenciaDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: LicenciaDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<FileBadge className="size-7" />}
    />
  );
}
