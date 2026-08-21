import type { ReactNode } from "react";
import { Heart } from "lucide-react";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";

interface EdoCivilDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function EdoCivilDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: EdoCivilDialogHeaderProps) {
  return (
    <CatalogDialogHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      icon={<Heart className="size-7" />}
    />
  );
}
