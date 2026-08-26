import type { ReactNode } from "react";
import { Thermometer } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface EnfermedadDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function EnfermedadDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: EnfermedadDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Thermometer className="size-7" />}
    />
  );
}
