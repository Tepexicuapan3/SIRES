import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface TipoAutorizacionDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function TipoAutorizacionDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: TipoAutorizacionDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<ShieldCheck className="size-7" />}
    />
  );
}
