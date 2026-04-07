import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, ShieldUser } from "lucide-react";
import { useAuthSession } from "@/domains/auth-access/hooks/useAuthSession";
import { useAuthCapabilities } from "@/domains/auth-access/hooks/useAuthCapabilities";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { useDebounce } from "@shared/hooks/useDebounce";
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
import { useUsersList } from "@/domains/auth-access/hooks/rbac/users/useUsersList";
import { useActivateUser } from "@/domains/auth-access/hooks/rbac/users/useActivateUser";
import { useDeactivateUser } from "@/domains/auth-access/hooks/rbac/users/useDeactivateUser";
import { useRolesList } from "@/domains/auth-access/hooks/rbac/roles/useRolesList";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useTableDetailsDialog } from "@features/admin/shared/hooks/useTableDetailsDialog";
import { UserDetailsDialog } from "@/domains/auth-access/components/admin/rbac/users/UserDetailsDialog";
import { UserCreateDialog } from "@/domains/auth-access/components/admin/rbac/users/UserCreateDialog";
import {
  buildUsersTableColumns,
  buildUsersVisibilityOptions,
} from "@/domains/auth-access/components/admin/rbac/users/UsersTableColumns";
import {
  createCapabilityResolver,
  RBAC_CAPABILITIES_DEGRADED_MESSAGE,
} from "@/domains/auth-access/adapters/rbac/capabilities-gating";
import { getUserErrorMessage } from "@/domains/auth-access/adapters/rbac/users/users.feedback";
import type { UserListItem } from "@api/types";

const USER_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
} as const;

const ROLE_FILTER_ALL = "all";
const CLINIC_FILTER_ALL = "all";

type UserStatusFilter =
  (typeof USER_STATUS_FILTER)[keyof typeof USER_STATUS_FILTER];

export function UsersPage() {
  const { hasCapability } = usePermissionDependencies();
  const {
    isLoading: isCapabilitiesLoading,
    isError: isCapabilitiesError,
    refetch: refetchCapabilities,
  } = useAuthCapabilities();
  const { data: authUser } = useAuthSession();
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
  const [createOpen, setCreateOpen] = useState(false);
  const {
    open: detailsOpen,
    selectedItem: selectedUser,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<UserListItem>();
  const debouncedSearch = useDebounce(search, 400);
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const { resolveCapability } = createCapabilityResolver({
    hasCapability,
    isCapabilitiesLoading,
    isCapabilitiesError,
  });

  const canReadRolesCatalog = resolveCapability(
    "admin.users.rolesCatalog.read",
    {
      allOf: ["admin:gestion:roles:read"],
    },
  );
  const canReadPermissionsCatalog = resolveCapability(
    "admin.users.permissionsCatalog.read",
    {
      allOf: ["admin:gestion:permisos:read"],
    },
  );
  const canReadClinicsCatalog = resolveCapability(
    "admin.users.clinicsCatalog.read",
    {
      allOf: ["admin:catalogos:centros_atencion:read"],
    },
  );

  const canCreateUser = resolveCapability("admin.users.create", {
    allOf: ["admin:gestion:usuarios:create"],
  });
  const canUpdateUser = resolveCapability("admin.users.update", {
    allOf: ["admin:gestion:usuarios:update"],
  });
  const canReadUser = resolveCapability("admin.users.read", {
    allOf: ["admin:gestion:usuarios:read"],
  });

  const { data, isLoading, isFetching, error, refetch } = useUsersList(
    {
      page,
      pageSize,
      search: debouncedSearch || undefined,
      status:
        statusFilter === USER_STATUS_FILTER.ALL ? undefined : statusFilter,
      roleId: roleFilter === ROLE_FILTER_ALL ? undefined : Number(roleFilter),
      clinicId:
        clinicFilter === CLINIC_FILTER_ALL ? undefined : Number(clinicFilter),
    },
    {
      enabled: canReadUser,
    },
  );
  const rows = data?.items ?? [];

  const { data: rolesData } = useRolesList(
    {
      page: 1,
      pageSize: 100,
      isActive: true,
    },
    {
      enabled: canReadRolesCatalog,
    },
  );
  const {
    data: clinicsData,
    isLoading: isLoadingClinicsCatalog,
    isFetching: isFetchingClinicsCatalog,
  } = useCentrosAtencionList(
    {
      page: 1,
      pageSize: 100,
      isActive: true,
    },
    {
      enabled: canReadClinicsCatalog,
    },
  );
  const roleOptions = rolesData?.items ?? [];
  const clinicOptions = clinicsData?.items ?? [];

  const canManageUsersFully = resolveCapability("admin.users.editFull", {
    allOf: [
      "admin:gestion:usuarios:read",
      "admin:gestion:usuarios:update",
      "admin:gestion:roles:read",
      "admin:gestion:permisos:read",
    ],
  });

  const canUpdateUserAccess = canManageUsersFully || canUpdateUser;
  const showActions = canReadUser || canUpdateUser;
  const isStatusPending = activateUser.isPending || deactivateUser.isPending;

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

  const columns = buildUsersTableColumns({
    canReadUser,
    canUpdateUser,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (user) => {
      void handleToggleStatus(user);
    },
  });
  const visibilityOptions = buildUsersVisibilityOptions(showActions);

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
  const capabilityErrorDescription = RBAC_CAPABILITIES_DEGRADED_MESSAGE.users;

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
      isLoading: isFetching,
      disabled: isFetching || !canReadUser,
      onSelect: () => {
        if (isFetching || !canReadUser) {
          return;
        }

        void refetch();
      },
    },
    {
      id: "export-users",
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
        {
          id: USER_STATUS_FILTER.PENDING,
          label: "Pendientes",
          selected: statusFilter === USER_STATUS_FILTER.PENDING,
          onSelect: () => {
            setStatusFilter(USER_STATUS_FILTER.PENDING);
            setPage(1);
          },
        },
      ],
    },
    ...(canReadRolesCatalog
      ? [
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
        ]
      : []),
    ...(canReadClinicsCatalog
      ? [
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
        ]
      : []),
  ];

  return (
    <div className="mx-auto w-full space-y-6 px-4 pb-2 sm:px-6 lg:max-w-[1360px] lg:px-8 xl:px-10">
      <AdminPageIntro
        title="Usuarios"
        description="Administra cuentas, rol primario y estado de acceso desde un solo tablero operativo."
        icon={<ShieldUser className="size-12" />}
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
            {canCreateUser ? (
              <TablePrimaryAction
                permission="admin:gestion:usuarios:create"
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
        isLoading={isCapabilitiesLoading || isLoading || isSearchPending}
        isError={isCapabilitiesError || Boolean(error)}
        errorTitle={
          isCapabilitiesError
            ? "No se pudo validar permisos"
            : "No se pudo cargar usuarios"
        }
        errorDescription={
          isCapabilitiesError
            ? capabilityErrorDescription
            : tableErrorDescription
        }
        hasFilters={hasFilters}
        onRowClick={canReadUser ? handleOpenDetails : undefined}
        onRetry={() => {
          if (isCapabilitiesError) {
            void refetchCapabilities();
            return;
          }
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
        isClinicsCatalogLoading={
          isLoadingClinicsCatalog || isFetchingClinicsCatalog
        }
        canEdit={canUpdateUserAccess}
        canReadRolesCatalog={canReadRolesCatalog}
        canReadPermissionsCatalog={canReadPermissionsCatalog}
        currentUserId={authUser?.id ?? null}
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
