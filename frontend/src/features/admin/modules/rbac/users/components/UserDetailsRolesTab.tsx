import { useState } from "react";
import { Plus, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRoleBadgeVariant } from "@features/admin/shared/utils/roleBadge";
import { useAssignRoles } from "@features/admin/modules/rbac/users/mutations/useAssignRoles";
import { useRevokeUserRole } from "@features/admin/modules/rbac/users/mutations/useRevokeUserRole";
import { useSetPrimaryRole } from "@features/admin/modules/rbac/users/mutations/useSetPrimaryRole";
import { getUserErrorMessage } from "@features/admin/modules/rbac/users/utils/users.feedback";
import { formatDate } from "@features/admin/modules/rbac/users/utils/users.format";
import type { RoleListItem, UserRole } from "@api/types";

interface UserDetailsRolesTabProps {
  userId: number;
  roles: UserRole[];
  roleOptions: RoleListItem[];
  isEditable?: boolean;
}

export function UserDetailsRolesTab({
  userId,
  roles,
  roleOptions,
  isEditable = true,
}: UserDetailsRolesTabProps) {
  const [roleToAdd, setRoleToAdd] = useState("");
  const assignRoles = useAssignRoles();
  const setPrimaryRole = useSetPrimaryRole();
  const revokeUserRole = useRevokeUserRole();

  const availableRoles = roleOptions.filter(
    (role) => !roles.some((userRole) => userRole.id === role.id),
  );
  const primaryRoleId = roles.find((role) => role.isPrimary)?.id;
  const secondaryRoles = roles.filter((role) => !role.isPrimary);
  const rolesCount = roles.length;

  const handleAddRole = async () => {
    if (!isEditable) return;
    if (!roleToAdd) return;
    try {
      const selectedRole = roleOptions.find(
        (role) => role.id.toString() === roleToAdd,
      );
      await assignRoles.mutateAsync({
        userId,
        data: { roleIds: [Number(roleToAdd)] },
      });
      toast.success("Rol agregado", {
        description: selectedRole?.name || "Rol agregado correctamente",
      });
      setRoleToAdd("");
    } catch (error) {
      toast.error("No se pudo agregar el rol", {
        description: getUserErrorMessage(error, "Error al asignar rol"),
      });
    }
  };

  const handleSetPrimary = async (roleId: number) => {
    if (!isEditable) return;
    try {
      await setPrimaryRole.mutateAsync({
        userId,
        data: { roleId },
      });
      toast.success("Rol principal actualizado");
    } catch (error) {
      toast.error("No se pudo actualizar el rol principal", {
        description: getUserErrorMessage(error, "Error al actualizar rol"),
      });
    }
  };

  const handleRemoveRole = async (roleId: number) => {
    if (!isEditable) return;
    try {
      await revokeUserRole.mutateAsync({ userId, roleId });
      toast.success("Rol removido");
    } catch (error) {
      toast.error("No se pudo remover el rol", {
        description: getUserErrorMessage(error, "Error al remover rol"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line-struct bg-paper p-4">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-txt-body">
              Rol principal
            </h4>
            <p className="text-xs text-txt-muted">
              Define el rol base para reportes y permisos.
            </p>
          </div>
          <Select
            value={primaryRoleId ? primaryRoleId.toString() : ""}
            onValueChange={(value) => void handleSetPrimary(Number(value))}
            disabled={
              roles.length === 0 || setPrimaryRole.isPending || !isEditable
            }
          >
            <SelectTrigger className="h-10 w-full sm:max-w-md">
              <SelectValue placeholder="Selecciona rol primario" />
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
                onValueChange={setRoleToAdd}
                disabled={!isEditable}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-56">
                  <SelectValue placeholder="Agregar rol" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleAddRole()}
                disabled={!roleToAdd || assignRoles.isPending || !isEditable}
              >
                <Plus className="size-4" />
                Agregar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {secondaryRoles.length === 0 ? (
              <div className="rounded-xl border border-line-struct/60 bg-subtle/40 px-3 py-4 text-sm text-txt-muted">
                No hay roles adicionales asignados.
              </div>
            ) : (
              secondaryRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-struct/60 bg-subtle/40 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={getRoleBadgeVariant(role.name)}
                      className="max-w-[220px] truncate"
                    >
                      {role.name}
                    </Badge>
                    <span className="text-xs text-txt-muted">
                      Asignado {formatDate(role.assignedAt)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remover rol ${role.name}`}
                    onClick={() => void handleRemoveRole(role.id)}
                    disabled={
                      roles.length <= 1 ||
                      revokeUserRole.isPending ||
                      !isEditable
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-txt-muted">
            <ShieldCheck className="size-4" />
            Total de roles asignados: {rolesCount}
          </div>
        </div>
      </div>
    </div>
  );
}
