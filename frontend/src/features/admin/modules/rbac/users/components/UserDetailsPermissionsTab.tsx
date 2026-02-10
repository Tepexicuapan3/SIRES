import { useState } from "react";
import { CalendarDays, Plus, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionHierarchyExplorer } from "@features/admin/modules/rbac/shared/components/PermissionHierarchyExplorer";
import { comparePermissionCodesByHierarchy } from "@features/admin/modules/rbac/shared/utils/permission-hierarchy";
import { useAddUserOverride } from "@features/admin/modules/rbac/users/mutations/useAddUserOverride";
import { useRemoveUserOverride } from "@features/admin/modules/rbac/users/mutations/useRemoveUserOverride";
import { getUserErrorMessage } from "@features/admin/modules/rbac/users/utils/users.feedback";
import type { Permission, PermissionEffect, UserOverride } from "@api/types";

interface UserDetailsPermissionsTabProps {
  userId: number;
  overrides: UserOverride[];
  permissions: Permission[];
  isLoadingPermissions: boolean;
  isEditable?: boolean;
  catalogErrorMessage?: string | null;
  onRetryCatalog?: () => void;
}

export function UserDetailsPermissionsTab({
  userId,
  overrides,
  permissions,
  isLoadingPermissions,
  isEditable = true,
  catalogErrorMessage = null,
  onRetryCatalog,
}: UserDetailsPermissionsTabProps) {
  const [overrideDates, setOverrideDates] = useState<Record<string, string>>(
    {},
  );
  const addOverride = useAddUserOverride();
  const removeOverride = useRemoveUserOverride();

  const getOverrideDateValue = (
    permissionCode: string,
    expiresAt: string | null,
  ) => {
    const dateFromState = overrideDates[permissionCode];
    if (dateFromState !== undefined) {
      return dateFromState;
    }

    return expiresAt ? expiresAt.split("T")[0] : "";
  };

  const availablePermissions = permissions.filter(
    (permission) =>
      !overrides.some(
        (override) => override.permissionCode === permission.code,
      ),
  );

  const availablePermissionEntries = availablePermissions.map((permission) => ({
    id: permission.id.toString(),
    code: permission.code,
    description: permission.description,
    payload: permission,
  }));

  const sortedOverrides = [...overrides].sort((first, second) =>
    comparePermissionCodesByHierarchy(
      first.permissionCode,
      second.permissionCode,
    ),
  );

  const handleAddOverride = async (permissionCode: string) => {
    if (!isEditable) return;

    try {
      await addOverride.mutateAsync({
        userId,
        data: {
          permissionCode,
          effect: "ALLOW",
        },
      });
      toast.success("Override agregado", {
        description: permissionCode,
      });
    } catch (error) {
      toast.error("No se pudo agregar el override", {
        description: getUserErrorMessage(error, "Error al agregar override"),
      });
    }
  };

  const handleToggleOverride = async (override: UserOverride) => {
    if (!isEditable) return;

    const nextEffect: PermissionEffect =
      override.effect === "ALLOW" ? "DENY" : "ALLOW";
    const expiresAt = getOverrideDateValue(
      override.permissionCode,
      override.expiresAt,
    );

    try {
      await addOverride.mutateAsync({
        userId,
        data: {
          permissionCode: override.permissionCode,
          effect: nextEffect,
          expiresAt: expiresAt || undefined,
        },
      });
      toast.success("Override actualizado", {
        description: override.permissionCode,
      });
    } catch (error) {
      toast.error("No se pudo actualizar el override", {
        description: getUserErrorMessage(error, "Error al actualizar override"),
      });
    }
  };

  const handleOverrideDateChange = (permissionCode: string, value: string) => {
    setOverrideDates((prev) => ({ ...prev, [permissionCode]: value }));
  };

  const handleOverrideDateBlur = async (
    permissionCode: string,
    effect: PermissionEffect,
    fallbackExpiresAt: string | null,
  ) => {
    if (!isEditable) return;

    const expiresAt =
      getOverrideDateValue(permissionCode, fallbackExpiresAt) || undefined;

    try {
      await addOverride.mutateAsync({
        userId,
        data: {
          permissionCode,
          effect,
          expiresAt: expiresAt || undefined,
        },
      });
      toast.success("Fecha actualizada", {
        description: permissionCode,
      });
    } catch (error) {
      toast.error("No se pudo actualizar la fecha", {
        description: getUserErrorMessage(error, "Error al actualizar fecha"),
      });
    }
  };

  const handleRemoveOverride = async (permissionCode: string) => {
    if (!isEditable) return;

    try {
      await removeOverride.mutateAsync({ userId, permissionCode });
      setOverrideDates((prev) => {
        const nextDates = { ...prev };
        delete nextDates[permissionCode];
        return nextDates;
      });
      toast.success("Override eliminado", {
        description: permissionCode,
      });
    } catch (error) {
      toast.error("No se pudo eliminar el override", {
        description: getUserErrorMessage(error, "Error al eliminar override"),
      });
    }
  };

  return (
    <div className="space-y-6">
      {catalogErrorMessage ? (
        <div className="rounded-xl border border-status-critical/30 bg-status-critical/5 px-4 py-3 text-xs text-status-critical">
          <p>{catalogErrorMessage}</p>
          {onRetryCatalog ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onRetryCatalog}
            >
              Reintentar catalogo
            </Button>
          ) : null}
        </div>
      ) : null}

      <PermissionHierarchyExplorer
        title="Catalogo de permisos"
        description="Encuentra permisos por jerarquia para crear overrides rapidamente."
        entries={availablePermissionEntries}
        isLoading={isLoadingPermissions}
        emptyMessage="No hay permisos disponibles para agregar override."
        actionLabel="Agregar"
        actionIcon={<Plus className="size-4" />}
        actionVariant="outline"
        isActionPending={addOverride.isPending}
        isActionDisabled={() => !isEditable || Boolean(catalogErrorMessage)}
        onAction={(item) => {
          void handleAddOverride(item.payload.code);
        }}
        actionAriaLabel={(item) => `Agregar override ${item.code}`}
      />

      <div className="rounded-2xl border border-line-struct bg-paper p-4">
        <div className="space-y-3">
          {sortedOverrides.length === 0 ? (
            <div className="rounded-xl border border-line-struct/60 bg-subtle/40 px-3 py-4 text-sm text-txt-muted">
              No hay overrides configurados.
            </div>
          ) : (
            sortedOverrides.map((override) => {
              const isAllowed = override.effect === "ALLOW";
              const statusLabel = isAllowed ? "Permitido" : "Denegado";
              const StatusIcon = isAllowed ? ShieldCheck : ShieldAlert;

              return (
                <div
                  key={override.id}
                  className="space-y-3 rounded-xl border border-line-struct/60 bg-subtle/40 px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={
                          isAllowed
                            ? "flex size-8 items-center justify-center rounded-xl bg-status-stable/10 text-status-stable"
                            : "flex size-8 items-center justify-center rounded-xl bg-status-critical/10 text-status-critical"
                        }
                      >
                        <StatusIcon className="size-4" />
                      </span>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-txt-body">
                          {override.permissionCode}
                        </div>
                        <div className="text-xs text-txt-muted">
                          {override.permissionDescription}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Eliminar override ${override.permissionCode}`}
                      onClick={() =>
                        void handleRemoveOverride(override.permissionCode)
                      }
                      disabled={removeOverride.isPending || !isEditable}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleToggleOverride(override)}
                        disabled={addOverride.isPending || !isEditable}
                      >
                        {isAllowed ? "Cambiar a DENY" : "Cambiar a ALLOW"}
                      </Button>
                      <span
                        className={
                          isAllowed
                            ? "text-xs text-status-stable"
                            : "text-xs text-status-critical"
                        }
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-txt-muted" />
                      <Input
                        type="date"
                        className="h-8 w-40"
                        value={getOverrideDateValue(
                          override.permissionCode,
                          override.expiresAt,
                        )}
                        onChange={(event) =>
                          handleOverrideDateChange(
                            override.permissionCode,
                            event.target.value,
                          )
                        }
                        onBlur={() =>
                          void handleOverrideDateBlur(
                            override.permissionCode,
                            override.effect,
                            override.expiresAt,
                          )
                        }
                        disabled={!isEditable}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <p className="text-xs text-txt-muted">
        Allow agrega permisos adicionales. Deny revoca permisos heredados del
        rol.
      </p>
    </div>
  );
}
