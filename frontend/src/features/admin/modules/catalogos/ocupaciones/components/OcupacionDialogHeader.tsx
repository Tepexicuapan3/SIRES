import type { ReactNode } from "react";
import { Hammer } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface OcupacionDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function OcupacionDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: OcupacionDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Hammer className="size-7" />}
    />
  );
}
