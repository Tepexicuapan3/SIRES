import { useState } from "react";
import {
  AlertTriangle,
  Download,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  UserCheck,
  UserX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useRolesList } from "@features/admin/modules/rbac/roles/queries/useRolesList";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
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
      username: true,
      fullname: true,
      email: true,
      primaryRole: true,
      isActive: true,
      actions: true,
    });
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, error } = useUsersList({
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

  const baseColumns: DataTableColumn<UserListItem>[] = [
    {
      key: "username",
      header: "Usuario",
      accessorKey: "username",
    },
    {
      key: "fullname",
      header: "Nombre",
      accessorKey: "fullname",
    },
    {
      key: "email",
      header: "Correo",
      accessorKey: "email",
    },
    {
      key: "primaryRole",
      header: "Rol primario",
      accessorKey: "primaryRole",
      render: (row) => row.primaryRole ?? "—",
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

  const actionColumn: DataTableColumn<UserListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-10",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canReadUser) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
        });
      }

      if (canUpdateUser) {
        actions.push(
          {
            id: `edit-${row.id}`,
            label: "Editar",
            icon: Pencil,
          },
          {
            id: `status-${row.id}`,
            label: row.isActive ? "Desactivar" : "Activar",
            icon: row.isActive ? UserX : UserCheck,
            variant: row.isActive ? "destructive" : "default",
          },
        );
      }

      return actions.length > 0 ? <TableToolbar actions={actions} /> : null;
    },
  };

  const columns = showActions ? [...baseColumns, actionColumn] : baseColumns;

  const visibilityOptions: TableColumnVisibilityItem[] = [
    { key: "username", label: "Usuario" },
    { key: "fullname", label: "Nombre" },
    { key: "email", label: "Correo" },
    { key: "primaryRole", label: "Rol primario" },
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
          id: USER_STATUS_FILTER.ALL,
          label: "Todos",
          selected: statusFilter === USER_STATUS_FILTER.ALL,
          onSelect: () => {
            setStatusFilter(USER_STATUS_FILTER.ALL);
            setPage(1);
          },
        },
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
        {
          id: ROLE_FILTER_ALL,
          label: "Todos",
          selected: roleFilter === ROLE_FILTER_ALL,
          onSelect: () => {
            setRoleFilter(ROLE_FILTER_ALL);
            setPage(1);
          },
        },
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
      label: "Clinica",
      options: [
        {
          id: CLINIC_FILTER_ALL,
          label: "Todas",
          selected: clinicFilter === CLINIC_FILTER_ALL,
          onSelect: () => {
            setClinicFilter(CLINIC_FILTER_ALL);
            setPage(1);
          },
        },
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
            className="w-full max-w-60"
            inputClassName="h-8 text-sm bg-contrast text-txt-contrast border-contrast focus:border-contrast focus:ring-0"
          />
        }
        actions={
          <>
            <TableFilterMenu
              sections={filterSections}
              appliedCount={appliedFiltersCount}
              onClear={() => {
                setStatusFilter(USER_STATUS_FILTER.ALL);
                setRoleFilter(ROLE_FILTER_ALL);
                setClinicFilter(CLINIC_FILTER_ALL);
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
              permission="admin:gestion:usuarios:create"
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
            Ocurrió un error al consultar los usuarios. Intentá nuevamente.
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
        emptyTitle="Sin usuarios"
        emptyDescription="Cuando existan usuarios registrados se listarán aquí."
      />
    </div>
  );
}

export default UsersPage;
