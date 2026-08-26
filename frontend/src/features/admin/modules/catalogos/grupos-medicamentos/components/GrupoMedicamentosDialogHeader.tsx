import type { ReactNode } from "react";
import { Pill } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface GrupoMedicamentosDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function GrupoMedicamentosDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: GrupoMedicamentosDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Pill className="size-7" />}
    />
  );
}
