import { useState } from "react";
import { toast } from "sonner";
import { Download, Droplet, Plus, RotateCcw } from "lucide-react";
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
import { TipoSanguineoCreateDialog } from "@features/admin/modules/catalogos/tipos-sanguineo/components/TipoSanguineoCreateDialog";
import { TipoSanguineoDetailsDialog } from "@features/admin/modules/catalogos/tipos-sanguineo/components/TipoSanguineoDetailsDialog";
import {
  buildTiposSanguineoTableColumns,
  buildTiposSanguineoVisibilityOptions,
} from "@features/admin/modules/catalogos/tipos-sanguineo/components/TiposSanguineoTableColumns";
import { useDeleteTipoSanguineo } from "@features/admin/modules/catalogos/tipos-sanguineo/mutations/useDeleteTipoSanguineo";
import { useUpdateTipoSanguineo } from "@features/admin/modules/catalogos/tipos-sanguineo/mutations/useUpdateTipoSanguineo";
import { useTiposSanguineoList } from "@features/admin/modules/catalogos/tipos-sanguineo/queries/useTiposSanguineoList";
import { getTipoSanguineoErrorMessage } from "@features/admin/modules/catalogos/tipos-sanguineo/utils/tipos-sanguineo.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { TipoSanguineoListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function TiposSanguineoPage() {
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
  const [itemToDelete, setItemToDelete] = useState<TipoSanguineoListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedItem,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<TipoSanguineoListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateTipoSanguineo = useUpdateTipoSanguineo();
  const deleteTipoSanguineo = useDeleteTipoSanguineo();

  const canRead = hasCapability("admin.catalogs.tiposSanguineo.read", {
    allOf: ["admin:catalogos:tipos_sanguineo:read"],
  });
  const canCreate = hasCapability("admin.catalogs.tiposSanguineo.create", {
    allOf: ["admin:catalogos:tipos_sanguineo:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.tiposSanguineo.update", {
    allOf: ["admin:catalogos:tipos_sanguineo:update"],
  });
  const canDelete = hasCapability("admin.catalogs.tiposSanguineo.delete", {
    allOf: ["admin:catalogos:tipos_sanguineo:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useTiposSanguineoList(
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
  const isStatusPending = updateTipoSanguineo.isPending;

  const handleToggleStatus = async (item: TipoSanguineoListItem) => {
    const nextStatus = !item.isActive;

    try {
      await updateTipoSanguineo.mutateAsync({
        id: item.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Tipo sanguineo activado" : "Tipo sanguineo desactivado");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getTipoSanguineoErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteTipoSanguineo.mutateAsync({ id: itemToDelete.id });

      toast.success("Tipo sanguineo eliminado", {
        description: `El tipo sanguineo ${itemToDelete.name} se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getTipoSanguineoErrorMessage(
          mutationError,
          "Error al eliminar tipo sanguineo",
        ),
      });
    }
  };

  const columns = buildTiposSanguineoTableColumns({
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

  const visibilityOptions = buildTiposSanguineoVisibilityOptions(showActions);

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
      ? getTipoSanguineoErrorMessage(
          error,
          "No se pudo obtener el listado de tipos sanguineos. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-tipos-sanguineo",
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
      id: "export-tipos-sanguineo",
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
          label: "Activos",
          selected: statusFilter === STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: STATUS_FILTER.INACTIVE,
          label: "Inactivos",
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
      title="Tipos sanguineos"
      description="Catalogo de tipos sanguineos para historia clinica."
      icon={<Droplet className="size-12" />}
    >
      {!canRead ? (
        <AdminReadOnlyNotice message="No tienes acceso para consultar este catalogo." />
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
                permission="admin:catalogos:tipos_sanguineo:create"
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
        errorTitle="No se pudo cargar tipos sanguineos"
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
        emptyTitle="Sin tipos sanguineos"
        emptyDescription="Cuando existan tipos sanguineos registrados se listaran aqui."
      />

      <TipoSanguineoDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        tipoSanguineoSummary={selectedItem}
        canEdit={canUpdate}
      />

      <TipoSanguineoCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar tipo sanguineo"
        description="Esta accion dara de baja el tipo sanguineo y lo quitara del catalogo."
        onConfirm={() => {
          void handleDelete();
        }}
        confirmDisabled={deleteTipoSanguineo.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default TiposSanguineoPage;
