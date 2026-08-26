import type { ReactNode } from "react";
import { Ticket } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface PaseDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function PaseDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: PaseDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Ticket className="size-7" />}
    />
  );
}
