import type { ReactNode } from "react";

interface AdminDetailsHeaderProps {
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
  leadingVisual?: ReactNode;
}

export function AdminDetailsHeader({
  title,
  subtitle,
  status,
  meta,
  leadingVisual,
}: AdminDetailsHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        {leadingVisual}
        <div className="flex min-h-16 min-w-0 flex-1 flex-col justify-center space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="block max-w-full truncate text-lg font-semibold text-txt-body"
              title={title}
            >
              {title}
            </span>
          </div>
          {subtitle ? (
            <div className="truncate text-sm text-txt-muted" title={subtitle}>
              {subtitle}
            </div>
          ) : null}
          {status || meta ? (
            <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs text-txt-muted">
              {status ? <div className="shrink-0">{status}</div> : null}
              {meta ? <div className="min-w-0 flex-1">{meta}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
