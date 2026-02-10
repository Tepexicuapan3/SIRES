import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useRolesList } from "@features/admin/modules/rbac/roles/queries/useRolesList";
import { useDeleteRole } from "@features/admin/modules/rbac/roles/mutations/useDeleteRole";
import { RoleDetailsDialog } from "@features/admin/modules/rbac/roles/components/RoleDetailsDialog";
import { RoleCreateDialog } from "@features/admin/modules/rbac/roles/components/RoleCreateDialog";
import { getRoleErrorMessage } from "@features/admin/modules/rbac/roles/utils/roles.feedback";
import type { RoleListItem } from "@api/types";
import { usePermissions } from "@features/auth/queries/usePermissions";
import { useDebounce } from "@/hooks/useDebounce";

const ROLE_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type RoleStatusFilter =
  (typeof ROLE_STATUS_FILTER)[keyof typeof ROLE_STATUS_FILTER];

const ROLE_TYPE_FILTER = {
  ALL: "all",
  SYSTEM: "system",
  CUSTOM: "custom",
} as const;

type RoleTypeFilter = (typeof ROLE_TYPE_FILTER)[keyof typeof ROLE_TYPE_FILTER];

export function RolesPage() {
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoleStatusFilter>(
    ROLE_STATUS_FILTER.ALL,
  );
  const [typeFilter, setTypeFilter] = useState<RoleTypeFilter>(
    ROLE_TYPE_FILTER.ALL,
  );
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      name: true,
      description: true,
      permissionsCount: true,
      usersCount: true,
      isSystem: true,
      isActive: true,
      actions: true,
    });
  const [selectedRole, setSelectedRole] = useState<RoleListItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const deleteRole = useDeleteRole();

  const { data, isLoading, error, refetch } = useRolesList({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    isActive:
      statusFilter === ROLE_STATUS_FILTER.ALL
        ? undefined
        : statusFilter === ROLE_STATUS_FILTER.ACTIVE,
    isSystem:
      typeFilter === ROLE_TYPE_FILTER.ALL
        ? undefined
        : typeFilter === ROLE_TYPE_FILTER.SYSTEM,
  });
  const rows = data?.items ?? [];

  const canUpdateRole = hasPermission("admin:gestion:roles:update");
  const canDeleteRole = hasPermission("admin:gestion:roles:delete");
  const canReadRole = hasPermission("admin:gestion:roles:read");
  const showActions = canReadRole || canUpdateRole || canDeleteRole;
  const canEditDialog = canUpdateRole;

  const handleOpenDetails = (role: RoleListItem) => {
    setSelectedRole(role);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedRole(null);
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await deleteRole.mutateAsync({ roleId: selectedRole.id });
      toast.success("Rol eliminado", {
        description: `El rol ${selectedRole.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast.error("No se pudo eliminar", {
        description: getRoleErrorMessage(error, "Error al eliminar rol"),
      });
    }
  };

  const baseColumns: DataTableColumn<RoleListItem>[] = [
    {
      key: "name",
      header: "Rol",
      accessorKey: "name",
    },
    {
      key: "description",
      header: "Descripción",
      accessorKey: "description",
    },
    {
      key: "permissionsCount",
      header: "Permisos",
      align: "center",
      accessorKey: "permissionsCount",
    },
    {
      key: "usersCount",
      header: "Usuarios",
      align: "center",
      accessorKey: "usersCount",
    },
    {
      key: "isSystem",
      header: "Tipo",
      align: "center",
      accessorKey: "isSystem",
      render: (row) =>
        row.isSystem ? (
          <Badge variant="outline">Sistema</Badge>
        ) : (
          <Badge variant="secondary">Custom</Badge>
        ),
    },
    {
      key: "isActive",
      header: "Estado",
      align: "center",
      accessorKey: "isActive",
      render: (row) =>
        row.isActive ? (
          <Badge variant="stable">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
  ];

  const actionColumn: DataTableColumn<RoleListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canReadRole) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => handleOpenDetails(row),
        });
      }

      if (canUpdateRole) {
        actions.push({
          id: `edit-${row.id}`,
          label: "Editar",
          icon: Pencil,
          disabled: row.isSystem,
          onSelect: () => handleOpenDetails(row),
        });
      }

      if (canDeleteRole) {
        if (actions.length > 0) {
          actions.push({ id: `divider-${row.id}`, type: "separator" });
        }
        actions.push({
          id: `delete-${row.id}`,
          label: "Eliminar",
          icon: Trash2,
          disabled: row.isSystem,
          variant: "destructive",
          onSelect: () => {
            setSelectedRole(row);
            setDeleteOpen(true);
          },
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
    { key: "name", label: "Rol" },
    { key: "description", label: "Descripción" },
    { key: "permissionsCount", label: "Permisos" },
    { key: "usersCount", label: "Usuarios" },
    { key: "isSystem", label: "Tipo" },
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
    statusFilter !== ROLE_STATUS_FILTER.ALL,
    typeFilter !== ROLE_TYPE_FILTER.ALL,
  ].filter(Boolean).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters = Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0;
  const tableErrorDescription = error
    ? getRoleErrorMessage(
        error,
        "No se pudo obtener el listado de roles. Intenta nuevamente.",
      )
    : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(ROLE_STATUS_FILTER.ALL);
    setTypeFilter(ROLE_TYPE_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-roles",
      label: "Actualizar",
      icon: RotateCcw,
    },
    {
      id: "export-roles",
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
          id: ROLE_STATUS_FILTER.ALL,
          label: "Todos",
          selected: statusFilter === ROLE_STATUS_FILTER.ALL,
          onSelect: () => {
            setStatusFilter(ROLE_STATUS_FILTER.ALL);
            setPage(1);
          },
        },
        {
          id: ROLE_STATUS_FILTER.ACTIVE,
          label: "Activos",
          selected: statusFilter === ROLE_STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(ROLE_STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: ROLE_STATUS_FILTER.INACTIVE,
          label: "Inactivos",
          selected: statusFilter === ROLE_STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(ROLE_STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
    {
      id: "type",
      label: "Tipo",
      options: [
        {
          id: ROLE_TYPE_FILTER.ALL,
          label: "Todos",
          selected: typeFilter === ROLE_TYPE_FILTER.ALL,
          onSelect: () => {
            setTypeFilter(ROLE_TYPE_FILTER.ALL);
            setPage(1);
          },
        },
        {
          id: ROLE_TYPE_FILTER.SYSTEM,
          label: "Sistema",
          selected: typeFilter === ROLE_TYPE_FILTER.SYSTEM,
          onSelect: () => {
            setTypeFilter(ROLE_TYPE_FILTER.SYSTEM);
            setPage(1);
          },
        },
        {
          id: ROLE_TYPE_FILTER.CUSTOM,
          label: "Custom",
          selected: typeFilter === ROLE_TYPE_FILTER.CUSTOM,
          onSelect: () => {
            setTypeFilter(ROLE_TYPE_FILTER.CUSTOM);
            setPage(1);
          },
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl border border-line-struct bg-subtle/40 text-txt-muted">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-txt-body">Roles</h1>
            <p className="mt-1 text-sm text-txt-muted">
              Listado base de roles configurados en el sistema
            </p>
          </div>
        </div>
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
              permission="admin:gestion:roles:create"
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
        errorTitle="No se pudo cargar roles"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadRole ? handleOpenDetails : undefined}
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
        emptyTitle="Sin roles"
        emptyDescription="Cuando existan roles configurados se listarán aquí."
      />
      <RoleDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        roleSummary={selectedRole}
        canEdit={canEditDialog}
        onClose={handleCloseDetails}
      />
      <RoleCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar rol</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion dara de baja el rol y lo quitara del catalogo.
              {selectedRole?.usersCount ? (
                <span className="mt-2 block text-xs text-status-alert">
                  El rol tiene usuarios asignados y no podra eliminarse.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteRole()}
              disabled={
                deleteRole.isPending || Boolean(selectedRole?.usersCount)
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default RolesPage;
