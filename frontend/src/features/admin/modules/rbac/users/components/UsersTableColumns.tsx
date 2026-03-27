import { Eye, UserCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import type { UserListItem } from "@api/types";
import { getRoleBadgeVariant } from "@features/admin/shared/utils/roleBadge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";
import { resolveUserUiStatus } from "@features/admin/modules/rbac/users/utils/users.format";

interface BuildUsersTableColumnsOptions {
  canReadUser: boolean;
  canUpdateUser: boolean;
  isStatusPending: boolean;
  onOpenDetails: (user: UserListItem) => void;
  onToggleStatus: (user: UserListItem) => void;
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

const getAvatarUrl = (row: UserListItem) =>
  (row as { avatarUrl?: string | null }).avatarUrl ?? undefined;

export const buildUsersTableColumns = ({
  canReadUser,
  canUpdateUser,
  isStatusPending,
  onOpenDetails,
  onToggleStatus,
}: BuildUsersTableColumnsOptions): DataTableColumn<UserListItem>[] => {
  const baseColumns: DataTableColumn<UserListItem>[] = [
    {
      key: "user",
      header: "Usuario",
      className: "w-[260px]",
      skeleton: (
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ),
      render: (row) => {
        const displayName = row.fullname || row.username;
        const initials = getInitials(displayName || row.username);
        const avatarUrl = getAvatarUrl(row);

        return (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-xs font-semibold text-txt-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-txt-body">
                {displayName || "Sin nombre"}
              </div>
              <div className="truncate text-xs text-txt-muted">
                {row.username}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Correo",
      accessorKey: "email",
      className: "w-[240px]",
      cellContentClassName: "max-w-[220px]",
    },
    {
      key: "clinic",
      header: "Centro",
      accessorKey: "clinic",
      className: "w-[200px]",
      cellContentClassName: "max-w-[200px]",
      render: (row) => row.clinic?.name ?? "Sin centro",
    },
    {
      key: "primaryRole",
      header: "Rol",
      align: "center",
      accessorKey: "primaryRole",
      className: "w-[160px]",
      render: (row) => {
        const roleLabel = row.primaryRole?.trim() || "Sin rol";
        const roleVariant = getRoleBadgeVariant(roleLabel);

        return (
          <Badge variant={roleVariant} className="max-w-35 truncate">
            {roleLabel}
          </Badge>
        );
      },
    },
    {
      key: "isActive",
      header: "Estado",
      align: "center",
      accessorKey: "isActive",
      className: "w-24",
      render: (row) => {
        const uiStatus = resolveUserUiStatus(row);

        if (uiStatus === "pending") {
          return (
            <Badge variant="alert" className="gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-status-alert" />
              Pendiente
            </Badge>
          );
        }

        return uiStatus === "active" ? (
          <Badge variant="stable" className="gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-status-stable" />
            Activo
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-txt-muted" />
            Inactivo
          </Badge>
        );
      },
    },
  ];

  const showActions = canReadUser || canUpdateUser;

  if (!showActions) {
    return baseColumns;
  }

  const actionColumn: DataTableColumn<UserListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canReadUser) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => onOpenDetails(row),
        });
      }

      if (canUpdateUser) {
        actions.push({
          id: `status-${row.id}`,
          label: row.isActive ? "Desactivar" : "Activar",
          icon: row.isActive ? UserX : UserCheck,
          variant: row.isActive ? "destructive" : "default",
          disabled: isStatusPending,
          onSelect: () => onToggleStatus(row),
        });
      }

      return actions.length > 0 ? (
        <div
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <TableToolbar actions={actions} />
        </div>
      ) : null;
    },
  };

  return [...baseColumns, actionColumn];
};

export const buildUsersVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "user", label: "Usuario" },
    { key: "email", label: "Correo" },
    { key: "clinic", label: "Centro" },
    { key: "primaryRole", label: "Rol" },
    { key: "isActive", label: "Estado" },
  ];

  if (showActions) {
    options.push({
      key: "actions",
      label: "Acciones",
      canHide: false,
    });
  }

  return options;
};
