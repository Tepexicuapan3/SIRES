import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, Syringe } from "lucide-react";
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
import {
  buildInventarioTableColumns,
  buildInventarioVisibilityOptions,
} from "../components/InventarioTableColumns";
import { InventarioCreateDialog } from "../components/InventarioCreateDialog";
import { InventarioDetailsDialog } from "../components/InventarioDetailsDialog";
import { useDeleteInventario } from "../mutations/useDeleteInventario";
import { useUpdateInventario } from "../mutations/useUpdateInventario";
import { useInventarioList } from "../queries/useInventarioList";
import { useInventarioVacunasOptions } from "../queries/useInventarioVacunasOptions";
import { getInventarioErrorMessage } from "../utils/inventario-vacunas.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { InventarioVacunaListItem } from "@api/types";

const STATUS_FILTER = { ALL: "all", ACTIVE: "active", INACTIVE: "inactive" } as const;
type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function InventarioVacunasPage() {
  const { hasCapability } = usePermissionDependencies();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER.ALL);
  const [vaccineFilter, setVaccineFilter] = useState<number | null>(null);
  const [centerFilter, setCenterFilter] = useState<number | null>(null);

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    vaccine: true, center: true, stockQuantity: true,
    appliedDoses: true, availableDoses: true, isActive: true, actions: true,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventarioVacunaListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<InventarioVacunaListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateInventario = useUpdateInventario();
  const deleteInventario = useDeleteInventario();

  const canRead = hasCapability("farmacia.vacunas.read", { allOf: ["farmacia:vacunas:read"] });
  const canCreate = hasCapability("farmacia.vacunas.create", { allOf: ["farmacia:vacunas:create"] });
  const canUpdate = hasCapability("farmacia.vacunas.update", { allOf: ["farmacia:vacunas:update"] });
  const canDelete = hasCapability("farmacia.vacunas.delete", { allOf: ["farmacia:vacunas:delete"] });

  // Carga opciones de catálogos existentes para los filtros
  const { vacunaOptions, centroOptions } = useInventarioVacunasOptions(canRead);

  const { data, isLoading, isFetching, error, refetch } = useInventarioList(
    {
      page,
      pageSize,
      search: debouncedSearch.trim() || undefined,
      vaccineId: vaccineFilter ?? undefined,
      centerId: centerFilter ?? undefined,
      isActive:
        statusFilter === STATUS_FILTER.ALL
          ? undefined
          : statusFilter === STATUS_FILTER.ACTIVE,
    },
    { enabled: canRead },
  );

  const rows = data?.items ?? [];
  const showActions = canRead || canUpdate || canDelete;
  const isStatusPending = updateInventario.isPending;

  const handleToggleStatus = async (item: InventarioVacunaListItem) => {
    const nextStatus = !item.isActive;
    try {
      await updateInventario.mutateAsync({ inventarioId: item.id, data: { isActive: nextStatus } });
      toast.success(nextStatus ? "Registro activado" : "Registro desactivado");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getInventarioErrorMessage(mutationError, "Error al actualizar estado"),
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteInventario.mutateAsync({ inventarioId: itemToDelete.id });
      toast.success("Registro eliminado", {
        description: `El inventario de ${itemToDelete.vaccine.name} en ${itemToDelete.center.name} se eliminó correctamente.`,
      });
      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getInventarioErrorMessage(mutationError, "Error al eliminar registro"),
      });
    }
  };

  const columns = buildInventarioTableColumns({
    canRead,
    canUpdate,
    canDelete,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (item) => { void handleToggleStatus(item); },
    onRequestDelete: (item) => { setItemToDelete(item); setDeleteOpen(true); },
  });

  const visibilityOptions = buildInventarioVisibilityOptions(showActions);
  const visibleColumns = columns.filter((col) => columnVisibility[col.key] ?? true);

  const appliedFiltersCount = [
    statusFilter !== STATUS_FILTER.ALL,
    vaccineFilter !== null,
    centerFilter !== null,
  ].filter(Boolean).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters = canRead && (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);

  const tableErrorDescription =
    canRead && error
      ? getInventarioErrorMessage(error, "No se pudo obtener el inventario. Intenta nuevamente.")
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setVaccineFilter(null);
    setCenterFilter(null);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh",
      label: "Actualizar",
      icon: RotateCcw,
      isLoading: isFetching,
      disabled: isFetching,
      onSelect: () => { if (isFetching) return; void refetch(); },
    },
    {
      id: "export",
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
          onSelect: () => { setStatusFilter(STATUS_FILTER.ACTIVE); setPage(1); },
        },
        {
          id: STATUS_FILTER.INACTIVE,
          label: "Inactivos",
          selected: statusFilter === STATUS_FILTER.INACTIVE,
          onSelect: () => { setStatusFilter(STATUS_FILTER.INACTIVE); setPage(1); },
        },
      ],
    },
    {
      id: "vaccine",
      label: "Vacuna",
      options: vacunaOptions.map((v) => ({
        id: String(v.id),
        label: v.name,
        selected: vaccineFilter === v.id,
        onSelect: () => {
          setVaccineFilter((prev) => (prev === v.id ? null : v.id));
          setPage(1);
        },
      })),
    },
    {
      id: "center",
      label: "Centro de atención",
      options: centroOptions.map((c) => ({
        id: String(c.id),
        label: c.name,
        selected: centerFilter === c.id,
        onSelect: () => {
          setCenterFilter((prev) => (prev === c.id ? null : c.id));
          setPage(1);
        },
      })),
    },
  ];

  return (
    <CatalogModuleLayout
      title="Inventario de Vacunas"
      description="Gestión de existencias de vacunas por centro de atención."
      icon={<Syringe className="size-12" />}
    >
      {!canRead ? (
        <AdminReadOnlyNotice message="No tienes acceso para consultar el inventario de vacunas." />
      ) : null}

      <TableHeaderBar
        search={
          <TableSearch
            value={search}
            onChange={(value) => { setSearch(value); setPage(1); }}
            placeholder="Buscar por nombre de vacuna"
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
                permission="farmacia:vacunas:create"
                label="Nuevo registro"
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
        errorTitle="No se pudo cargar el inventario"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canRead ? handleOpenDetails : undefined}
        onRetry={() => { void refetch(); }}
        onClearFilters={handleClearFilters}
        pagination={{
          page,
          pageSize,
          total: data?.total ?? 0,
          totalPages: data?.totalPages ?? 1,
          onPageChange: setPage,
          onPageSizeChange: (value) => { setPageSize(value); setPage(1); },
        }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin registros de inventario"
        emptyDescription="Registra la existencia inicial de vacunas por centro de atención."
      />

      <InventarioDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        itemSummary={selectedItem}
        canEdit={canUpdate}
        canApplyDoses={canUpdate}
      />

      <InventarioCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar registro de inventario"
        description="Esta acción dará de baja el registro de inventario y lo quitará del módulo de farmacia."
        onConfirm={() => { void handleDelete(); }}
        confirmDisabled={deleteInventario.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default InventarioVacunasPage;
