import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface EscolaridadDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function EscolaridadDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: EscolaridadDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<GraduationCap className="size-7" />}
    />
  );
}
