import { useState } from "react";
import { toast } from "sonner";
import { Download, FileBadge, Plus, RotateCcw } from "lucide-react";
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
import { ConfirmDestructiveDialog } from "@features/admin/shared/components/ConfirmDestructiveDialog";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { useTableDetailsDialog } from "@features/admin/shared/hooks/useTableDetailsDialog";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { LicenciaCreateDialog } from "@features/admin/modules/catalogos/licencias/components/LicenciaCreateDialog";
import { LicenciaDetailsDialog } from "@features/admin/modules/catalogos/licencias/components/LicenciaDetailsDialog";
import {
  buildLicenciasTableColumns,
  buildLicenciasVisibilityOptions,
} from "@features/admin/modules/catalogos/licencias/components/LicenciasTableColumns";
import { useDeleteLicencia } from "@features/admin/modules/catalogos/licencias/mutations/useDeleteLicencia";
import { useUpdateLicencia } from "@features/admin/modules/catalogos/licencias/mutations/useUpdateLicencia";
import { useLicenciasList } from "@features/admin/modules/catalogos/licencias/queries/useLicenciasList";
import { getLicenciaErrorMessage } from "@features/admin/modules/catalogos/licencias/utils/licencias.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { LicenciaListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function LicenciasPage() {
  const { hasCapability } = usePermissionDependencies();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    STATUS_FILTER.ALL,
  );

  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({ name: true, isActive: true, actions: true });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LicenciaListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<LicenciaListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateLicencia = useUpdateLicencia();
  const deleteLicencia = useDeleteLicencia();

  const canRead = hasCapability("admin.catalogs.licencias.read", {
    allOf: ["admin:catalogos:licencias:read"],
  });
  const canCreate = hasCapability("admin.catalogs.licencias.create", {
    allOf: ["admin:catalogos:licencias:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.licencias.update", {
    allOf: ["admin:catalogos:licencias:update"],
  });
  const canDelete = hasCapability("admin.catalogs.licencias.delete", {
    allOf: ["admin:catalogos:licencias:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useLicenciasList(
    {
      page,
      pageSize,
      search: debouncedSearch.trim() || undefined,
      isActive:
        statusFilter === STATUS_FILTER.ALL
          ? undefined
          : statusFilter === STATUS_FILTER.ACTIVE,
    },
    { enabled: canRead },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();

  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((item) =>
          item.name.toLowerCase().includes(normalizedSearch),
        );

  const showActions = canRead || canUpdate || canDelete;
  const isStatusPending = updateLicencia.isPending;

  const handleToggleStatus = async (item: LicenciaListItem) => {
    const nextStatus = !item.isActive;

    try {
      await updateLicencia.mutateAsync({
        id: item.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Licencia activada" : "Licencia desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getLicenciaErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteLicencia.mutateAsync({ id: itemToDelete.id });

      toast.success("Licencia eliminada", {
        description: `La licencia ${itemToDelete.name} se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getLicenciaErrorMessage(
          mutationError,
          "Error al eliminar licencia",
        ),
      });
    }
  };

  const columns = buildLicenciasTableColumns({
    canRead,
    canUpdate,
    canDelete,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (item) => {
      void handleToggleStatus(item);
    },
    onRequestDelete: (item) => {
      setItemToDelete(item);
      setDeleteOpen(true);
    },
  });

  const visibilityOptions = buildLicenciasVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(
    Boolean,
  ).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();

  const hasFilters =
    canRead && (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);

  const tableErrorDescription =
    canRead && error
      ? getLicenciaErrorMessage(
          error,
          "No se pudo obtener el listado de licencias. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-licencias",
      label: "Actualizar",
      icon: RotateCcw,
      isLoading: isFetching,
      disabled: isFetching,
      onSelect: () => {
        if (isFetching) return;
        void refetch();
      },
    },
    {
      id: "export-licencias",
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
          id: STATUS_FILTER.ACTIVE,
          label: "Activas",
          selected: statusFilter === STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: STATUS_FILTER.INACTIVE,
          label: "Inactivas",
          selected: statusFilter === STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Licencias Médicas"
      description="Catálogo de tipos de licencias médicas."
      icon={<FileBadge className="size-12" />}
    >
      {!canRead ? (
        <AdminReadOnlyNotice message="No tienes acceso para consultar este catálogo." />
      ) : null}

      <TableHeaderBar
        search={
          <TableSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Buscar por nombre"
            disabled={!canRead}
          />
        }
        actions={
          <>
            {canRead ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}

            {canRead ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}

            {canRead ? <TableOptionsMenu options={tableOptions} /> : null}

            {canCreate ? (
              <TablePrimaryAction
                permission="admin:catalogos:licencias:create"
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
        isError={canRead && Boolean(error)}
        errorTitle="No se pudo cargar licencias"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canRead ? handleOpenDetails : undefined}
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
        emptyTitle="Sin licencias"
        emptyDescription="Cuando existan licencias registradas se listaran aqui."
      />

      <LicenciaDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        licenciaSummary={selectedItem}
        canEdit={canUpdate}
      />

      <LicenciaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar licencia"
        description="Esta accion dara de baja la licencia y la quitara del catalogo."
        onConfirm={() => {
          void handleDelete();
        }}
        confirmDisabled={deleteLicencia.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default LicenciasPage;
