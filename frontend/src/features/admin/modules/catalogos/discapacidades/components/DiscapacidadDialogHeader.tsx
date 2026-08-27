import type { ReactNode } from "react";
import { Accessibility } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface DiscapacidadDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function DiscapacidadDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: DiscapacidadDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Accessibility className="size-7" />}
    />
  );
}
