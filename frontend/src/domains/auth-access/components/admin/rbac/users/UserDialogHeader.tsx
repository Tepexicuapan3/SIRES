import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { AdminDetailsHeader } from "@features/admin/shared/components/details/AdminDetailsHeader";

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
    <AdminDetailsHeader
      title={title}
      subtitle={subtitle}
      status={status}
      meta={meta}
      leadingVisual={
        <Avatar className="h-16 w-16 border border-line-struct/60 bg-subtle/50">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={title} /> : null}
          <AvatarFallback className="text-xs font-semibold text-txt-muted">
            {initials}
          </AvatarFallback>
        </Avatar>
      }
    />
  );
}
