import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminReadOnlyNoticeProps {
  message: ReactNode;
  className?: string;
}

export function AdminReadOnlyNotice({
  message,
  className,
}: AdminReadOnlyNoticeProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line-struct bg-subtle/40 px-4 py-3 text-xs text-txt-muted",
        className,
      )}
      role="status"
    >
      <p className="inline-flex items-center gap-2">
        <Lock className="size-3.5 shrink-0" />
        <span>{message}</span>
      </p>
    </div>
  );
}
