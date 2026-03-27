import type { ReactNode } from "react";
import {
  Building2,
  Clock3,
  KeyRound,
  Mail,
  MapPin,
  Network,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { Badge } from "@shared/ui/badge";
import { ScrollArea } from "@shared/ui/ScrollArea";
import { Separator } from "@shared/ui/separator";

interface UserDetailsSidePanelProps {
  fullname: string;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  status?: ReactNode;
  primaryRole?: string | null;
  clinicName?: string | null;
  termsAccepted?: boolean;
  mustChangePassword?: boolean;
  lastLoginLabel: string;
  lastIpLabel: string;
  createdByLabel: string;
  updatedByLabel: string;
}

const getInitials = (value: string) => {
  const parts = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "??";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

interface SidePanelInfoItemProps {
  icon: ReactNode;
  value: string;
}

function SidePanelInfoItem({ icon, value }: SidePanelInfoItemProps) {
  return (
    <div className="flex min-w-0 items-start gap-2 text-xs">
      <span className="mt-0.5 shrink-0 text-txt-muted">{icon}</span>
      <p className="min-w-0 flex-1 break-all leading-relaxed text-txt-muted">
        {value}
      </p>
    </div>
  );
}

interface SidePanelActivityItemProps {
  icon: ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}

function SidePanelActivityItem({
  icon,
  label,
  value,
  isLast,
}: SidePanelActivityItemProps) {
  return (
    <div className="relative flex gap-2.5 pb-4 last:pb-0">
      {!isLast ? (
        <span
          aria-hidden
          className="absolute top-8 left-4 h-[calc(100%-1.1rem)] w-px bg-line-struct/70"
        />
      ) : null}

      <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-line-struct/70 bg-paper/70 text-txt-muted">
        {icon}
      </span>

      <div className="min-w-0 space-y-1">
        <p className="text-[11px] tracking-wide uppercase text-txt-muted">
          {label}
        </p>
        <p className="w-full break-words text-xs leading-relaxed text-txt-muted">
          {value}
        </p>
      </div>
    </div>
  );
}

export function UserDetailsSidePanel({
  fullname,
  username,
  email,
  avatarUrl,
  status,
  primaryRole,
  clinicName,
  termsAccepted,
  mustChangePassword,
  lastLoginLabel,
  lastIpLabel,
  createdByLabel,
  updatedByLabel,
}: UserDetailsSidePanelProps) {
  const initials = getInitials(fullname || username || "Usuario");
  const usernameLabel = username ? `@${username}` : "@sin_usuario";
  const activityItems = [
    {
      icon: <Clock3 className="size-3.5" />,
      label: "Ultimo acceso",
      value: lastLoginLabel,
    },
    {
      icon: <Network className="size-3.5" />,
      label: "Ultima IP",
      value: lastIpLabel,
    },
    {
      icon: <UserRound className="size-3.5" />,
      label: "Creado por",
      value: createdByLabel,
    },
    {
      icon: <UserRound className="size-3.5" />,
      label: "Actualizado por",
      value: updatedByLabel,
    },
  ] as const;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex min-h-full flex-col">
          <div className="px-5 pt-12 pb-4">
            <div className="flex w-full min-w-0 flex-col items-center gap-2.5 text-center">
              <Avatar className="size-20 rounded-3xl border border-line-struct/70 bg-subtle/40">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={fullname} />
                ) : null}
                <AvatarFallback className="rounded-3xl text-xs font-semibold text-txt-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="w-full min-w-0 space-y-3">
                <h3 className="w-full max-w-full break-words text-[16px] leading-tight font-semibold text-txt-muted uppercase">
                  {fullname}
                </h3>
                <p className="w-full max-w-full break-all font-mono text-sm text-txt-muted">
                  {usernameLabel}
                </p>
              </div>

              {status ? (
                <div className="flex w-full justify-center text-xs">
                  {status}
                </div>
              ) : null}
            </div>
          </div>

          <div className="px-5 pt-2 pb-4">
            <div className="space-y-3">
              <SidePanelInfoItem
                icon={<Mail className="size-4" />}
                value={email || "-"}
              />
              <SidePanelInfoItem
                icon={<Building2 className="size-4" />}
                value={primaryRole || "Sin rol"}
              />
              <SidePanelInfoItem
                icon={<MapPin className="size-4" />}
                value={clinicName || "Sin centro"}
              />

              <div className="self-center flex w-fit flex-wrap items-center justify-center gap-2.5 pt-1 text-center">
                {termsAccepted === false ? (
                  <Badge
                    variant="alert"
                    className="gap-1 rounded-full px-2 py-0.5 text-[11px]"
                  >
                    <TriangleAlert className="size-3" />
                    TyC pendientes
                  </Badge>
                ) : termsAccepted === true ? (
                  <Badge
                    variant="stable"
                    className="gap-1 rounded-full px-2 py-0.5 text-[11px]"
                  >
                    <ShieldCheck className="size-3" />
                    TyC aceptados
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-full px-2 py-0.5 text-[11px]"
                  >
                    TyC sin dato
                  </Badge>
                )}

                {mustChangePassword === true ? (
                  <Badge
                    variant="alert"
                    className="gap-1 rounded-full px-2 py-0.5 text-[11px]"
                  >
                    <KeyRound className="size-3" />
                    Cambio de pwd
                  </Badge>
                ) : mustChangePassword === false ? (
                  <Badge
                    variant="stable"
                    className="gap-1 rounded-full px-2 py-0.5 text-[11px]"
                  >
                    <KeyRound className="size-3" />
                    Sin cambio pwd
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-full px-2 py-0.5 text-[11px]"
                  >
                    <KeyRound className="size-3" />
                    Pwd sin dato
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4 px-5 pt-4 pb-7">
            <Separator />
            <p className="text-[11px] font-semibold tracking-wide text-txt-muted uppercase">
              Actividad
            </p>

            <div>
              {activityItems.map((item, index) => (
                <SidePanelActivityItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  isLast={index === activityItems.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
