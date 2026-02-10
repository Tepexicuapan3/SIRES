import { useState } from "react";
import { toast } from "sonner";
import { Download, Eye, Plus, RotateCcw, UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@features/auth/queries/usePermissions";
import { useDebounce } from "@/hooks/useDebounce";
import {
  DataTable,
  type DataTableColumn,
} from "@features/admin/shared/components/DataTable";
import {
  TableColumnVisibility,
  type ColumnVisibilityState,
  type TableColumnVisibilityItem,
} from "@features/admin/shared/components/TableColumnVisibility";
import { TableFilterMenu } from "@features/admin/shared/components/TableFilterMenu";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import {
  TableOptionsMenu,
  type TableOptionItem,
} from "@features/admin/shared/components/TableOptionsMenu";
import { TablePrimaryAction } from "@features/admin/shared/components/TablePrimaryAction";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";
import { useUsersList } from "@features/admin/modules/rbac/users/queries/useUsersList";
import { useActivateUser } from "@features/admin/modules/rbac/users/mutations/useActivateUser";
import { useDeactivateUser } from "@features/admin/modules/rbac/users/mutations/useDeactivateUser";
import { useRolesList } from "@features/admin/modules/rbac/roles/queries/useRolesList";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { getRoleBadgeVariant } from "@features/admin/shared/utils/roleBadge";
import { UserDetailsDialog } from "@features/admin/modules/rbac/users/components/UserDetailsDialog";
import { UserCreateDialog } from "@features/admin/modules/rbac/users/components/UserCreateDialog";
import { getUserErrorMessage } from "@features/admin/modules/rbac/users/utils/users.feedback";
import type { UserListItem } from "@api/types";

const USER_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

const ROLE_FILTER_ALL = "all";
const CLINIC_FILTER_ALL = "all";

type UserStatusFilter =
  (typeof USER_STATUS_FILTER)[keyof typeof USER_STATUS_FILTER];

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

export function UsersPage() {
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>(
    USER_STATUS_FILTER.ALL,
  );
  const [roleFilter, setRoleFilter] = useState(ROLE_FILTER_ALL);
  const [clinicFilter, setClinicFilter] = useState(CLINIC_FILTER_ALL);
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      user: true,
      email: true,
      clinic: true,
      primaryRole: true,
      isActive: true,
      actions: true,
    });
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();

  const { data, isLoading, error, refetch } = useUsersList({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    isActive:
      statusFilter === USER_STATUS_FILTER.ALL
        ? undefined
        : statusFilter === USER_STATUS_FILTER.ACTIVE,
    roleId: roleFilter === ROLE_FILTER_ALL ? undefined : Number(roleFilter),
    clinicId:
      clinicFilter === CLINIC_FILTER_ALL ? undefined : Number(clinicFilter),
  });
  const rows = data?.items ?? [];

  const { data: rolesData } = useRolesList({
    page: 1,
    pageSize: 200,
    isActive: true,
  });
  const { data: clinicsData } = useCentrosAtencionList({
    page: 1,
    pageSize: 200,
    isActive: true,
  });
  const roleOptions = rolesData?.items ?? [];
  const clinicOptions = clinicsData?.items ?? [];

  const canUpdateUser = hasPermission("admin:gestion:usuarios:update");
  const canReadUser = hasPermission("admin:gestion:usuarios:read");
  const showActions = canReadUser || canUpdateUser;
  const isStatusPending = activateUser.isPending || deactivateUser.isPending;

  const handleOpenDetails = (user: UserListItem) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = async (user: UserListItem) => {
    try {
      if (user.isActive) {
        await deactivateUser.mutateAsync({ userId: user.id });
        toast.success("Usuario desactivado");
      } else {
        await activateUser.mutateAsync({ userId: user.id });
        toast.success("Usuario activado");
      }
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getUserErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

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
      render: (row) =>
        row.isActive ? (
          <Badge variant="stable" className="gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-status-stable" />
            Activo
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-txt-muted" />
            Inactivo
          </Badge>
        ),
    },
  ];

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
          onSelect: () => handleOpenDetails(row),
        });
      }

      if (canUpdateUser) {
        actions.push({
          id: `status-${row.id}`,
          label: row.isActive ? "Desactivar" : "Activar",
          icon: row.isActive ? UserX : UserCheck,
          variant: row.isActive ? "destructive" : "default",
          disabled: isStatusPending,
          onSelect: () => void handleToggleStatus(row),
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

  const columns = showActions ? [...baseColumns, actionColumn] : baseColumns;

  const visibilityOptions: TableColumnVisibilityItem[] = [
    { key: "user", label: "Usuario" },
    { key: "email", label: "Correo" },
    { key: "clinic", label: "Centro" },
    { key: "primaryRole", label: "Rol" },
    { key: "isActive", label: "Estado" },
  ];

  if (showActions) {
    visibilityOptions.push({
      key: "actions",
      label: "Acciones",
      canHide: false,
    });
  }

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [
    statusFilter !== USER_STATUS_FILTER.ALL,
    roleFilter !== ROLE_FILTER_ALL,
    clinicFilter !== CLINIC_FILTER_ALL,
  ].filter(Boolean).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters = Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0;
  const tableErrorDescription = error
    ? getUserErrorMessage(
        error,
        "No se pudo obtener el listado de usuarios. Intenta nuevamente.",
      )
    : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(USER_STATUS_FILTER.ALL);
    setRoleFilter(ROLE_FILTER_ALL);
    setClinicFilter(CLINIC_FILTER_ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-users",
      label: "Actualizar",
      icon: RotateCcw,
    },
    {
      id: "export-users",
      label: "Exportar",
      icon: Download,
    },
  ];

  const filterSections = [
    {
      id: "status",
      label: "Estado",
      options: [
        {
          id: USER_STATUS_FILTER.ACTIVE,
          label: "Activos",
          selected: statusFilter === USER_STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(USER_STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: USER_STATUS_FILTER.INACTIVE,
          label: "Inactivos",
          selected: statusFilter === USER_STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(USER_STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
    {
      id: "role",
      label: "Rol",
      options: [
        ...roleOptions.map((role) => ({
          id: role.id.toString(),
          label: role.name,
          selected: roleFilter === role.id.toString(),
          onSelect: () => {
            setRoleFilter(role.id.toString());
            setPage(1);
          },
        })),
      ],
    },
    {
      id: "clinic",
      label: "Centro",
      options: [
        ...clinicOptions.map((clinic) => ({
          id: clinic.id.toString(),
          label: clinic.name,
          selected: clinicFilter === clinic.id.toString(),
          onSelect: () => {
            setClinicFilter(clinic.id.toString());
            setPage(1);
          },
        })),
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-txt-body">Usuarios</h1>
        <p className="mt-1 text-sm text-txt-muted">
          Listado base de usuarios registrados en el sistema
        </p>
      </div>

      <TableHeaderBar
        search={
          <TableSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Buscar en la tabla"
          />
        }
        actions={
          <>
            <TableFilterMenu
              sections={filterSections}
              appliedCount={appliedFiltersCount}
              onClear={handleClearFilters}
            />
            <TableColumnVisibility
              columns={visibilityOptions}
              visibility={columnVisibility}
              onVisibilityChange={setColumnVisibility}
            />
            <TableOptionsMenu options={tableOptions} />
            <TablePrimaryAction
              permission="admin:gestion:usuarios:create"
              label="Nuevo"
              icon={<Plus className="size-4" />}
              onClick={() => setCreateOpen(true)}
            />
          </>
        }
      />

      <DataTable
        columns={visibleColumns}
        rows={rows}
        isLoading={isLoading || isSearchPending}
        isError={Boolean(error)}
        errorTitle="No se pudo cargar usuarios"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadUser ? handleOpenDetails : undefined}
        onRetry={() => {
          void refetch();
        }}
        onClearFilters={handleClearFilters}
        pagination={{
          page,
          pageSize,
          total: data?.total ?? 0,
          totalPages: data?.totalPages ?? 1,
          onPageChange: setPage,
          onPageSizeChange: (value) => {
            setPageSize(value);
            setPage(1);
          },
        }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin usuarios"
        emptyDescription="Cuando existan usuarios registrados se listarán aquí."
      />
      <UserDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        userSummary={selectedUser}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
        canEdit={canUpdateUser}
        onClose={handleCloseDetails}
      />
      <UserCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
      />
    </div>
  );
}

export default UsersPage;
