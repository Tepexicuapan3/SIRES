import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line-struct/60 bg-subtle/50 text-brand">
          <ShieldCheck className="size-7" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-txt-body">{title}</span>
          </div>
          {subtitle ? (
            <div className="text-sm text-txt-muted">{subtitle}</div>
          ) : null}
          {status || meta ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-txt-muted">
              {status}
              {meta}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
