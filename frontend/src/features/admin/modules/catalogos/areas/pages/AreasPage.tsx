import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Download, Plus, RotateCcw } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
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
import { useTableDetailsDialog } from "@features/admin/shared/hooks/useTableDetailsDialog";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { useDeleteArea } from "@features/admin/modules/catalogos/areas/mutations/useDeleteArea";
import { useUpdateArea } from "@features/admin/modules/catalogos/areas/mutations/useUpdateArea";
import { useAreasList } from "@features/admin/modules/catalogos/areas/queries/useAreasList";
import {
  buildAreasTableColumns,
  buildAreasVisibilityOptions,
} from "@features/admin/modules/catalogos/areas/components/AreasTableColumns";
import { AreaCreateDialog } from "@features/admin/modules/catalogos/areas/components/AreaCreateDialog";
import { AreaDetailsDialog } from "@features/admin/modules/catalogos/areas/components/AreaDetailsDialog";
import { getAreaErrorMessage } from "@features/admin/modules/catalogos/areas/utils/areas.feedback";
import { usePermissions } from "@features/auth/queries/usePermissions";
import type { AreaListItem } from "@api/types";

const AREA_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type AreaStatusFilter =
  (typeof AREA_STATUS_FILTER)[keyof typeof AREA_STATUS_FILTER];

export function AreasPage() {
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AreaStatusFilter>(
    AREA_STATUS_FILTER.ALL,
  );
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      name: true,
      code: true,
      isActive: true,
      actions: true,
    });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<AreaListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedArea,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<AreaListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateArea = useUpdateArea();
  const deleteArea = useDeleteArea();

  const { data, isLoading, error, refetch } = useAreasList({
    page,
    pageSize,
    isActive:
      statusFilter === AREA_STATUS_FILTER.ALL
        ? undefined
        : statusFilter === AREA_STATUS_FILTER.ACTIVE,
  });

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((area) => {
          const matchesName = area.name
            .toLowerCase()
            .includes(normalizedSearch);
          const matchesCode = area.code
            .toLowerCase()
            .includes(normalizedSearch);
          return matchesName || matchesCode;
        });

  const canReadArea = hasPermission("admin:catalogos:areas:read");
  const canCreateArea = hasPermission("admin:catalogos:areas:create");
  const canUpdateArea = hasPermission("admin:catalogos:areas:update");
  const canDeleteArea = hasPermission("admin:catalogos:areas:delete");
  const showActions = canReadArea || canUpdateArea || canDeleteArea;
  const isStatusPending = updateArea.isPending;

  const handleToggleStatus = async (area: AreaListItem) => {
    const nextStatus = !area.isActive;

    try {
      await updateArea.mutateAsync({
        areaId: area.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Area activada" : "Area desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getAreaErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteArea = async () => {
    if (!areaToDelete) return;

    try {
      await deleteArea.mutateAsync({ areaId: areaToDelete.id });
      toast.success("Area eliminada", {
        description: `El area ${areaToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setAreaToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getAreaErrorMessage(
          mutationError,
          "Error al eliminar area",
        ),
      });
    }
  };

  const columns = buildAreasTableColumns({
    canReadArea,
    canUpdateArea,
    canDeleteArea,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (area) => {
      void handleToggleStatus(area);
    },
    onRequestDelete: (area) => {
      setAreaToDelete(area);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildAreasVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== AREA_STATUS_FILTER.ALL].filter(
    Boolean,
  ).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters = Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0;
  const tableErrorDescription = error
    ? getAreaErrorMessage(
        error,
        "No se pudo obtener el listado de areas. Intenta nuevamente.",
      )
    : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(AREA_STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-areas",
      label: "Actualizar",
      icon: RotateCcw,
      onSelect: () => {
        void refetch();
      },
    },
    {
      id: "export-areas",
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
          id: AREA_STATUS_FILTER.ACTIVE,
          label: "Activas",
          selected: statusFilter === AREA_STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(AREA_STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: AREA_STATUS_FILTER.INACTIVE,
          label: "Inactivas",
          selected: statusFilter === AREA_STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(AREA_STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Areas"
      description="Catalogo base de areas operativas del sistema."
      icon={<BookOpen className="size-12" />}
    >
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
            {canCreateArea ? (
              <TablePrimaryAction
                permission="admin:catalogos:areas:create"
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
        errorTitle="No se pudo cargar areas"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadArea ? handleOpenDetails : undefined}
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
        emptyTitle="Sin areas"
        emptyDescription="Cuando existan areas registradas se listaran aqui."
      />

      <AreaDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        areaSummary={selectedArea}
        canEdit={canUpdateArea}
      />

      <AreaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setAreaToDelete(null);
          }
        }}
        title="Eliminar area"
        description="Esta accion dara de baja el area y la quitara del catalogo."
        onConfirm={() => {
          void handleDeleteArea();
        }}
        confirmDisabled={deleteArea.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default AreasPage;
