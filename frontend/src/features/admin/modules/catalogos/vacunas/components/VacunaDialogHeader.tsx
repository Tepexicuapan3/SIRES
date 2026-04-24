import type { ReactNode } from "react";
import { Syringe } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface VacunaDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function VacunaDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: VacunaDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Syringe className="size-7" />}
    />
  );
}
