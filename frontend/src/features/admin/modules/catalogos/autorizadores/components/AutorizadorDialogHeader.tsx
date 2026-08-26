import type { ReactNode } from "react";
import { UserCog } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface AutorizadorDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function AutorizadorDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: AutorizadorDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<UserCog className="size-7" />}
    />
  );
}
