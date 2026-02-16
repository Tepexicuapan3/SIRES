import type { ReactNode } from "react";
import { Clock3, Route, ShieldCheck, UserRound, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/separator";

interface RoleDetailsSidePanelProps {
  name: string;
  description?: string | null;
  status?: ReactNode;
  isSystem: boolean;
  landingRoute?: string | null;
  permissionsCount: number;
  usersCount: number;
  createdByLabel: string;
  updatedByLabel: string;
}

interface SidePanelInfoItemProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function SidePanelInfoItem({ icon, label, value }: SidePanelInfoItemProps) {
  return (
    <div className="space-y-1 rounded-xl border border-line-struct/60 bg-paper/60 px-3 py-2.5">
      <p className="inline-flex items-center gap-1.5 text-[11px] tracking-wide text-txt-muted uppercase">
        {icon}
        {label}
      </p>
      <p className="text-xs leading-relaxed wrap-break-word text-txt-muted">
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
  isLast = false,
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
        <p className="w-full wrap-break-word text-xs leading-relaxed text-txt-muted">
          {value}
        </p>
      </div>
    </div>
  );
}

export function RoleDetailsSidePanel({
  name,
  description,
  status,
  isSystem,
  landingRoute,
  permissionsCount,
  usersCount,
  createdByLabel,
  updatedByLabel,
}: RoleDetailsSidePanelProps) {
  const activityItems = [
    {
      icon: <UserRound className="size-3.5" />,
      label: "Creado por",
      value: createdByLabel,
    },
    {
      icon: <Clock3 className="size-3.5" />,
      label: "Actualizado por",
      value: updatedByLabel,
    },
  ] as const;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex min-h-full flex-col">
          <div className="px-5 pt-12 pb-5">
            <div className="flex w-full min-w-0 flex-col items-center gap-3 text-center">
              <span className="flex size-20 items-center justify-center rounded-3xl border border-line-struct/70 bg-subtle/40 text-brand">
                <ShieldCheck className="size-8" />
              </span>

              <div className="w-full min-w-0 space-y-2">
                <h3 className="w-full max-w-full wrap-break-word text-[16px] leading-tight font-semibold text-txt-body uppercase">
                  {name}
                </h3>
                {description ? (
                  <p className="w-full max-w-full wrap-break-word text-xs text-txt-muted">
                    {description}
                  </p>
                ) : null}
              </div>

              <div className="flex w-full flex-wrap items-center justify-center gap-2">
                {status ? <div className="text-xs">{status}</div> : null}
                <Badge variant={isSystem ? "outline" : "secondary"}>
                  {isSystem ? "Sistema" : "Custom"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="px-5 pt-1 pb-4">
            <div className="space-y-3">
              <SidePanelInfoItem
                icon={<Route className="size-3.5" />}
                label="Landing route"
                value={landingRoute || "Sin ruta configurada"}
              />
              <SidePanelInfoItem
                icon={<ShieldCheck className="size-3.5" />}
                label="Permisos"
                value={`${permissionsCount} permisos activos`}
              />
              <SidePanelInfoItem
                icon={<Users className="size-3.5" />}
                label="Usuarios"
                value={`${usersCount} usuarios asignados`}
              />
            </div>
          </div>

          <div className="mt-auto space-y-4 px-5 pt-4 pb-7">
            <Separator />
            <p className="text-[11px] font-semibold tracking-wide text-txt-muted uppercase">
              Auditoria
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
