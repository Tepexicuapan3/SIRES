import type { ReactNode } from "react";
import { Landmark } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface ReligionDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function ReligionDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: ReligionDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Landmark className="size-7" />}
    />
  );
}
