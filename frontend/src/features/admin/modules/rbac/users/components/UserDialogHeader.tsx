import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserDialogHeaderProps {
  title: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
  fallbackLabel?: string;
}

const getInitials = (value: string) => {
  const parts = value.split(" ").filter(Boolean);
  if (parts.length === 0) return "??";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export function UserDialogHeader({
  title,
  subtitle,
  avatarUrl,
  status,
  meta,
  fallbackLabel = "Usuario",
}: UserDialogHeaderProps) {
  const initials = getInitials(title || fallbackLabel);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-16 w-16 border border-line-struct/60 bg-subtle/50">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={title} /> : null}
          <AvatarFallback className="text-xs font-semibold text-txt-muted">
            {initials}
          </AvatarFallback>
        </Avatar>
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
