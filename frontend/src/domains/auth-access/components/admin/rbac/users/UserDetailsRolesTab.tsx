import { useState } from "react";
import { CalendarDays, Plus, ShieldCheck, UserRound, X } from "lucide-react";
import { Button } from "@shared/ui/button";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  formatDate,
  formatDateTime,
} from "@/domains/auth-access/adapters/rbac/users/users.format";
import type { RoleListItem, UserRole } from "@api/types";

interface UserDetailsRolesTabProps {
  roles: UserRole[];
  roleOptions: RoleListItem[];
  isEditable?: boolean;
  readOnlyMessage?: string;
  catalogAccessMessage?: string | null;
  isSaving?: boolean;
  onAddRole: (roleId: number) => void;
  onSetPrimaryRole: (roleId: number) => void;
  onRemoveRole: (roleId: number) => void;
}

export function UserDetailsRolesTab({
  roles,
  roleOptions,
  isEditable = true,
  readOnlyMessage = "Solo lectura: no puedes actualizar este usuario porque no tienes permisos.",
  catalogAccessMessage = null,
  isSaving = false,
  onAddRole,
  onSetPrimaryRole,
  onRemoveRole,
}: UserDetailsRolesTabProps) {
  const [roleToAdd, setRoleToAdd] = useState("");

  const availableRoles = roleOptions.filter(
    (role) => !roles.some((userRole) => userRole.id === role.id),
  );
  const primaryRole = roles.find((role) => role.isPrimary) ?? null;
  const primaryRoleId = primaryRole?.id;
  const secondaryRoles = roles.filter((role) => !role.isPrimary);
  const rolesCount = roles.length;
  const isBusy = isSaving;
  const showCatalogAccessNotice = Boolean(catalogAccessMessage) && isEditable;

  const primaryAssignedAtLabel = formatDateTime(
    primaryRole?.assignedAt ?? null,
  );
  const resolvedPrimaryAssignedAt =
    primaryAssignedAtLabel === "-"
      ? formatDate(primaryRole?.assignedAt ?? null)
      : primaryAssignedAtLabel;

  const handleAddRole = (value: string) => {
    if (!isEditable || isBusy) return;
    if (!value) return;
    onAddRole(Number(value));
    setRoleToAdd("");
  };

  return (
    <div className="space-y-6 pb-4">
      {!isEditable ? <AdminReadOnlyNotice message={readOnlyMessage} /> : null}
      {showCatalogAccessNotice ? (
        <AdminReadOnlyNotice message={catalogAccessMessage} />
      ) : null}

      <div className="rounded-2xl border border-line-struct bg-paper p-4">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-txt-body">
              Rol principal
            </h4>
            <p className="text-xs text-txt-muted">
              Define los permisos base del usuario en la plataforma.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-line-struct/60 bg-paper/80">
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line-struct/60 bg-subtle/40 text-txt-muted">
                  <ShieldCheck className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-txt-body">
                    {primaryRole?.name ?? "Sin rol"}
                  </p>
                  <p className="text-[11px] tracking-wide text-txt-muted uppercase">
                    Principal
                  </p>
                </div>
              </div>

              <Select
                value={primaryRoleId ? primaryRoleId.toString() : ""}
                onValueChange={(value) => {
                  const roleId = Number(value);
                  if (roleId === primaryRoleId) return;
                  onSetPrimaryRole(roleId);
                }}
                disabled={roles.length === 0 || isBusy || !isEditable}
              >
                <SelectTrigger className="h-10 w-full sm:w-44">
                  <div className="flex min-w-0 items-center gap-2">
                    <ShieldCheck className="size-4 shrink-0 text-txt-muted" />
                    <SelectValue placeholder="Selecciona rol" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-struct/50 px-3 py-2 text-xs text-txt-muted">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-3.5" />
                Asignado por {primaryRole?.assignedBy?.name ?? "-"}
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <CalendarDays className="size-3.5" />
                {resolvedPrimaryAssignedAt}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line-struct bg-paper p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-txt-body">
                Roles adicionales
              </h4>
              <p className="text-xs text-txt-muted">
                Roles complementarios que extienden permisos base.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Select
                value={roleToAdd}
                onValueChange={handleAddRole}
                disabled={
                  !isEditable ||
                  isBusy ||
                  availableRoles.length === 0 ||
                  showCatalogAccessNotice
                }
              >
                <SelectTrigger className="h-10 w-full sm:w-32">
                  <div className="flex items-center gap-2 text-sm">
                    <Plus className="size-4 text-txt-muted" />
                    <SelectValue placeholder="Agregar" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {secondaryRoles.length === 0 ? (
              <div className="rounded-xl border border-line-struct/60 bg-subtle/40 px-3 py-4 text-sm text-txt-muted">
                No hay roles adicionales asignados.
              </div>
            ) : (
              secondaryRoles.map((role) => {
                const assignedAtLabel = formatDateTime(role.assignedAt);
                const resolvedAssignedAt =
                  assignedAtLabel === "-"
                    ? formatDate(role.assignedAt)
                    : assignedAtLabel;

                return (
                  <div
                    key={role.id}
                    className="overflow-hidden rounded-xl border border-line-struct/60 bg-paper/80"
                  >
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-line-struct/60 bg-subtle/40 text-txt-muted">
                          <ShieldCheck className="size-4" />
                        </span>
                        <span className="truncate text-sm font-medium text-txt-body">
                          {role.name}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remover rol ${role.name}`}
                        onClick={() => onRemoveRole(role.id)}
                        disabled={roles.length <= 1 || isBusy || !isEditable}
                        className="size-8 shrink-0 rounded-lg"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-struct/50 px-3 py-2 text-xs text-txt-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="size-3.5" />
                        {role.assignedBy?.name ?? "-"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <CalendarDays className="size-3.5" />
                        {resolvedAssignedAt}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-line-struct/50 pt-3 text-xs text-txt-muted">
            <ShieldCheck className="size-4" />
            {rolesCount} roles asignados en total
          </div>
        </div>
      </div>
    </div>
  );
}
