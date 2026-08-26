import type { ReactNode } from "react";
import { UserMinus } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface BajaDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function BajaDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: BajaDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<UserMinus className="size-7" />}
    />
  );
}
