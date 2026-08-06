import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface TipoCitaDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function TipoCitaDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: TipoCitaDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<CalendarClock className="size-7" />}
    />
  );
}
