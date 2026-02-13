import type { ReactNode } from "react";
import {
  CalendarDays,
  Clock3,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RoleDetail } from "@api/types";
import { formatDateTime } from "@features/admin/modules/rbac/roles/utils/roles.format";

interface RoleDetailsAuditTabProps {
  roleDetail: RoleDetail;
}

interface RoleAuditActivityItemProps {
  icon: ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}

function RoleAuditActivityItem({
  icon,
  label,
  value,
  isLast = false,
}: RoleAuditActivityItemProps) {
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

export function RoleDetailsAuditTab({ roleDetail }: RoleDetailsAuditTabProps) {
  const createdLabel = `${roleDetail.createdBy?.name ?? "-"} ${formatDateTime(roleDetail.createdAt)}`;
  const updatedLabel = roleDetail.updatedAt
    ? `${roleDetail.updatedBy?.name ?? "-"} ${formatDateTime(roleDetail.updatedAt)}`
    : "Sin actualizaciones registradas.";

  const activityItems = [
    {
      icon: <UserRound className="size-3.5" />,
      label: "Creado por",
      value: createdLabel,
    },
    {
      icon: <Clock3 className="size-3.5" />,
      label: "Actualizado por",
      value: updatedLabel,
    },
  ] as const;

  return (
    <div className="space-y-6 pb-2">
      <div className="rounded-2xl border border-line-struct bg-paper p-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-txt-body">Actividad</h4>
          <p className="text-xs text-txt-muted">
            Historial de creacion y cambios aplicados al rol.
          </p>
        </div>

        <div className="mt-4">
          {activityItems.map((item, index) => (
            <RoleAuditActivityItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              isLast={index === activityItems.length - 1}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-line-struct bg-paper p-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-txt-body">
            Contexto actual
          </h4>
          <p className="text-xs text-txt-muted">
            Estado operativo y alcance vigente del rol.
          </p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line-struct/60 bg-paper px-3 py-2">
            <p className="inline-flex items-center gap-1.5 text-xs text-txt-muted">
              <ShieldCheck className="size-3.5" />
              Permisos activos
            </p>
            <p className="mt-1 text-sm font-semibold text-txt-body">
              {roleDetail.permissionsCount}
            </p>
          </div>

          <div className="rounded-xl border border-line-struct/60 bg-paper px-3 py-2">
            <p className="inline-flex items-center gap-1.5 text-xs text-txt-muted">
              <Users className="size-3.5" />
              Usuarios asignados
            </p>
            <p className="mt-1 text-sm font-semibold text-txt-body">
              {roleDetail.usersCount}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={roleDetail.isSystem ? "outline" : "secondary"}>
            {roleDetail.isSystem ? "Sistema" : "Custom"}
          </Badge>
          <Badge variant={roleDetail.isActive ? "stable" : "secondary"}>
            {roleDetail.isActive ? "Activo" : "Inactivo"}
          </Badge>
          <Badge variant="outline" className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDateTime(roleDetail.createdAt)}
          </Badge>
        </div>
      </div>
    </div>
  );
}
