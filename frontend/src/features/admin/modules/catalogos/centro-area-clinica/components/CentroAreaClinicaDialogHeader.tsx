import type { ReactNode } from "react";
import { Link2 } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface CentroAreaClinicaDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function CentroAreaClinicaDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: CentroAreaClinicaDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Link2 className="size-7" />}
    />
  );
}
