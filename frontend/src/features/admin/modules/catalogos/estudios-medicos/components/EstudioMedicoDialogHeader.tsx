import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface EstudioMedicoDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function EstudioMedicoDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: EstudioMedicoDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<FlaskConical className="size-7" />}
    />
  );
}
