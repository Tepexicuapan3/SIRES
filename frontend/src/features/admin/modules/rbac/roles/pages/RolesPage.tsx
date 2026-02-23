import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, ShieldCheck } from "lucide-react";
import { DataTable } from "@features/admin/shared/components/DataTable";
import {
  TableColumnVisibility,
  type ColumnVisibilityState,
} from "@features/admin/shared/components/TableColumnVisibility";
import { TableFilterMenu } from "@features/admin/shared/components/TableFilterMenu";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import {
  TableOptionsMenu,
  type TableOptionItem,
} from "@features/admin/shared/components/TableOptionsMenu";
import { TablePrimaryAction } from "@features/admin/shared/components/TablePrimaryAction";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { AdminPageIntro } from "@features/admin/shared/components/AdminPageIntro";
import { ConfirmDestructiveDialog } from "@features/admin/shared/components/ConfirmDestructiveDialog";
import { useRolesList } from "@features/admin/modules/rbac/roles/queries/useRolesList";
import { useDeleteRole } from "@features/admin/modules/rbac/roles/mutations/useDeleteRole";
import {
  buildRolesTableColumns,
  buildRolesVisibilityOptions,
} from "@features/admin/modules/rbac/roles/components/RolesTableColumns";
import { RoleDetailsDialog } from "@features/admin/modules/rbac/roles/components/RoleDetailsDialog";
import { RoleCreateDialog } from "@features/admin/modules/rbac/roles/components/RoleCreateDialog";
import { getRoleErrorMessage } from "@features/admin/modules/rbac/roles/utils/roles.feedback";
import { useTableDetailsDialog } from "@features/admin/shared/hooks/useTableDetailsDialog";
import type { RoleListItem } from "@api/types";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
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
  const { hasCapability } = usePermissionDependencies();
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
  const {
    open: detailsOpen,
    selectedItem: selectedRole,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<RoleListItem>();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleListItem | null>(null);
  const debouncedSearch = useDebounce(search, 400);
  const deleteRole = useDeleteRole();

  const { data, isLoading, isFetching, error, refetch } = useRolesList({
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

  const canCreateRole = hasCapability("admin.roles.create", {
    allOf: ["admin:gestion:roles:create"],
  });
  const canUpdateRole = hasCapability("admin.roles.update", {
    allOf: ["admin:gestion:roles:update"],
  });
  const canDeleteRole = hasCapability("admin.roles.delete", {
    allOf: ["admin:gestion:roles:delete"],
  });
  const canReadRole = hasCapability("admin.roles.read", {
    allOf: ["admin:gestion:roles:read"],
  });
  const canReadPermissionsCatalog = hasCapability(
    "admin.roles.permissionsCatalog.read",
    {
      allOf: ["admin:gestion:permisos:read"],
    },
  );
  const canOpenDetails = canReadRole || canUpdateRole;
  const showActions = canOpenDetails || canDeleteRole;
  const canEditDialog = hasCapability("admin.roles.editFull", {
    allOf: [
      "admin:gestion:roles:read",
      "admin:gestion:roles:update",
      "admin:gestion:permisos:read",
    ],
  });

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole.mutateAsync({ roleId: roleToDelete.id });
      toast.success("Rol eliminado", {
        description: `El rol ${roleToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      toast.error("No se pudo eliminar", {
        description: getRoleErrorMessage(error, "Error al eliminar rol"),
      });
    }
  };

  const columns = buildRolesTableColumns({
    canReadRole,
    canUpdateRole,
    canDeleteRole,
    onOpenDetails: handleOpenDetails,
    onRequestDelete: (role) => {
      setRoleToDelete(role);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildRolesVisibilityOptions(showActions);

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
      isLoading: isFetching,
      disabled: isFetching,
      onSelect: () => {
        if (isFetching) {
          return;
        }

        void refetch();
      },
    },
    {
      id: "export-roles",
      label: "Exportar",
      icon: Download,
      loadingAnimation: "pulse",
    },
  ];

  const filterSections = [
    {
      id: "status",
      label: "Estado",
      options: [
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
    <div className="mx-auto w-full space-y-6 px-4 pb-2 sm:px-6 lg:max-w-340 lg:px-8 xl:px-10">
      <AdminPageIntro
        title="Roles"
        description="Configura el catalogo de roles, su alcance de permisos y el estado operativo para controlar accesos."
        icon={<ShieldCheck className="size-12" />}
      />

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
            {canCreateRole ? (
              <TablePrimaryAction
                permission="admin:gestion:roles:create"
                dependencyAware
                label="Nuevo"
                icon={<Plus className="size-4" />}
                onClick={() => setCreateOpen(true)}
              />
            ) : null}
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
        onRowClick={canOpenDetails ? handleOpenDetails : undefined}
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
        canReadPermissionsCatalog={canReadPermissionsCatalog}
        onClose={handleCloseDetails}
      />
      <RoleCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setRoleToDelete(null);
          }
        }}
        title="Eliminar rol"
        description={
          roleToDelete
            ? `Se eliminara el rol ${roleToDelete.name} del catalogo operativo.`
            : "Se eliminara este rol del catalogo operativo."
        }
        warning={
          roleToDelete?.usersCount ? (
            <span>
              {`No se puede eliminar: el rol tiene ${roleToDelete.usersCount} usuario${roleToDelete.usersCount === 1 ? "" : "s"} asignado${roleToDelete.usersCount === 1 ? "" : "s"}. Reasigna esos usuarios y vuelve a intentarlo.`}
            </span>
          ) : null
        }
        textAlign="right"
        onConfirm={() => {
          void handleDeleteRole();
        }}
        confirmDisabled={
          deleteRole.isPending || Boolean(roleToDelete?.usersCount)
        }
      />
    </div>
  );
}

export default RolesPage;
