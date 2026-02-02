import { useState } from "react";
import {
  AlertTriangle,
  Download,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, error } = useRolesList({
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
    className: "w-10",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canReadRole) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
        });
      }

      if (canUpdateRole) {
        actions.push({
          id: `edit-${row.id}`,
          label: "Editar",
          icon: Pencil,
          disabled: row.isSystem,
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
        });
      }

      return actions.length > 0 ? <TableToolbar actions={actions} /> : null;
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
        <h1 className="text-2xl font-semibold text-txt-body">Roles</h1>
        <p className="mt-1 text-sm text-txt-muted">
          Listado base de roles configurados en el sistema
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
            className="w-full max-w-[240px]"
            inputClassName="h-8 text-sm bg-contrast text-txt-contrast border-contrast focus:border-contrast focus:ring-0"
          />
        }
        actions={
          <>
            <TableFilterMenu
              sections={filterSections}
              appliedCount={appliedFiltersCount}
              onClear={() => {
                setStatusFilter(ROLE_STATUS_FILTER.ALL);
                setTypeFilter(ROLE_TYPE_FILTER.ALL);
                setPage(1);
              }}
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
            />
          </>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No se pudo cargar el listado</AlertTitle>
          <AlertDescription>
            Ocurrió un error al consultar los roles. Intentá nuevamente.
          </AlertDescription>
        </Alert>
      ) : null}

      <DataTable
        columns={visibleColumns}
        rows={rows}
        isLoading={isLoading}
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
        footerNote={`Página ${page} de ${data?.totalPages ?? 1}`}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin roles"
        emptyDescription="Cuando existan roles configurados se listarán aquí."
      />
    </div>
  );
}

export default RolesPage;
