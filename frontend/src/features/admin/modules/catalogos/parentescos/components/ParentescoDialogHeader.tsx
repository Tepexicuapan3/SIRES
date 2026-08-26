import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface ParentescoDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function ParentescoDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: ParentescoDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Users className="size-7" />}
    />
  );
}
