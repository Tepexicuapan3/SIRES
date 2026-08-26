import type { ReactNode } from "react";
import { Microscope } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface EstudioDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function EstudioDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: EstudioDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Microscope className="size-7" />}
    />
  );
}
