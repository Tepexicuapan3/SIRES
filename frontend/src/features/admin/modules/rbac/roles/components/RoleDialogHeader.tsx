import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { AdminDetailsHeader } from "@features/admin/shared/components/details/AdminDetailsHeader";

interface RoleDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
}

export function RoleDialogHeader({
  title,
  subtitle,
  status,
  meta,
}: RoleDialogHeaderProps) {
  return (
    <AdminDetailsHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      leadingVisual={
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line-struct/60 bg-subtle/50 text-brand">
          <ShieldCheck className="size-7" />
        </div>
      }
    />
  );
}
